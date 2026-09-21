"use client";

import { CSSProperties, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PublicOrder, Rsvp } from "@/lib/types";
import { getStoredRsvp, setStoredRsvp } from "@/lib/rsvp-storage";
import { isPastDeadline, formatConversationalDate } from "@/lib/date";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import {
  WORLD_HEIGHT,
  CHARACTER_HEIGHT,
  CHARACTER_HEAD_Y_RATIO,
  REWARD_OFFSET_FROM_CHARACTER,
  GAME_FRAME_MAX_WIDTH,
  frameInset,
  frameWidth,
  RewardPhase,
} from "@/lib/game-constants";
import GameWorld from "./GameWorld";
import PreviewWatermark from "./PreviewWatermark";
import DialogueBox from "./DialogueBox";
import DialogueButton from "./DialogueButton";
import Confetti from "./Confetti";
import RsvpForm, { RsvpFormValues } from "./RsvpForm";
import ReturnVisitScreen from "./ReturnVisitScreen";
import TitleScreen from "./TitleScreen";
import AudioToggle, { AudioToggleHandle } from "./AudioToggle";
import { THEME_CONFIG, getTheme, themeUiStyle } from "@/lib/theme-config";
import { playSfx } from "@/lib/sfx";
import { DialogueSegment } from "@/lib/typewriter";
import { DIALOGUE_TONES, fillTemplate } from "@/lib/dialogue-tones";
import { CalendarIcon, LocationIcon, DressCodeIcon, CelebrationIcon } from "./PartyIcons";

const ICON_CLASS = "h-6 w-6";
const ICONS = {
  calendar: <CalendarIcon className={ICON_CLASS} />,
  location: <LocationIcon className={ICON_CLASS} />,
  dresscode: <DressCodeIcon className={ICON_CLASS} />,
  celebration: <CelebrationIcon className={ICON_CLASS} />,
};

type Screen =
  | { kind: "title" }
  | { kind: "opening" }
  | { kind: "none" }
  | { kind: "coin"; coinId: 1 | 2 | 3 }
  | { kind: "reward" }
  | { kind: "missionCompleteIntro" }
  | { kind: "missionComplete" }
  | { kind: "rsvpYes" }
  | { kind: "rsvpNo" }
  | { kind: "menu" }
  | { kind: "eventDetails" };

export default function GameClient({ order }: { order: PublicOrder }) {
  // Must start at "checking" on both server and client — the server has no
  // access to localStorage, so resolving synchronously from a lazy
  // initializer would make the client's first render disagree with the
  // server-rendered HTML (hydration mismatch) whenever a stored RSVP exists.
  const [mode, setMode] = useState<"checking" | "game" | "returnVisit">("checking");
  const [returnRsvp, setReturnRsvp] = useState<Rsvp | null>(null);
  // Only relevant while mode === "game": whether this playthrough should end
  // in the real RSVP flow, or is just a for-fun replay that goes straight
  // back to the return-visit screen without touching the database.
  const [gameMode, setGameMode] = useState<"rsvp" | "replay">("rsvp");

  useEffect(() => {
    const stored = getStoredRsvp(order.guest_link);
    if (!stored) {
      // Deferred via a microtask (not a bare synchronous call) since this
      // effect's only job is reconciling with the external localStorage
      // system, mirroring the async branch below.
      Promise.resolve().then(() => setMode("game"));
      return;
    }
    fetch(
      `/api/rsvp?guestLink=${encodeURIComponent(order.guest_link)}&guestPhone=${encodeURIComponent(
        stored.guestPhone
      )}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.rsvp) {
          setReturnRsvp(data.rsvp);
          setMode("returnVisit");
        } else {
          setMode("game");
        }
      })
      .catch(() => setMode("game"));
  }, [order.guest_link]);

  const showWatermark = order.payment_status !== "paid";
  const theme = getTheme(order.template);

  let content: ReactNode;
  if (mode === "checking") {
    content = (
      <div className="flex min-h-screen items-center justify-center bg-green-700 text-white">
        Loading...
      </div>
    );
  } else if (mode === "returnVisit" && returnRsvp) {
    content = (
      <>
        {showWatermark && <PreviewWatermark />}
        <ReturnVisitScreen
          order={order}
          rsvp={returnRsvp}
          onPlayAgain={() => {
            setGameMode("replay");
            setMode("game");
          }}
        />
      </>
    );
  } else {
    // The moment a guest submits their RSVP, they land on the same
    // ReturnVisitScreen a reopened link would show — that's the one place
    // with the "You're in!" event details and the calendar/maps actions.
    // Switching `mode` away from "game" unmounts <Game> entirely, so every
    // fresh mount (initial play or a replay) starts with clean state for free.
    content = (
      <>
        {showWatermark && <PreviewWatermark />}
        <Game
          order={order}
          mode={gameMode}
          onRsvpSuccess={(rsvp) => {
            setReturnRsvp(rsvp);
            setMode("returnVisit");
          }}
          onReplayDone={() => setMode("returnVisit")}
        />
      </>
    );
  }

  // The whole guest game renders inside a fixed-width, centered "phone
  // frame" at every screen size (see GAME_FRAME_MAX_WIDTH) — an outer,
  // full-viewport-width layer supplies the letterbox fill color on screens
  // wider than the frame, and an inner, width-capped layer holds the actual
  // game content in normal document flow (so window-level scroll and every
  // `position: fixed` overlay inside it keep behaving exactly as before).
  return (
    <div className="min-h-screen w-full" style={{ background: theme.uiColors.boxBg }}>
      <div
        className="relative mx-auto min-h-screen overflow-hidden"
        style={{ maxWidth: GAME_FRAME_MAX_WIDTH }}
      >
        {content}
      </div>
    </div>
  );
}

function Game({
  order,
  mode: gameMode,
  onRsvpSuccess,
  onReplayDone,
}: {
  order: PublicOrder;
  mode: "rsvp" | "replay";
  onRsvpSuccess: (rsvp: Rsvp) => void;
  onReplayDone: () => void;
}) {
  const audioToggleRef = useRef<AudioToggleHandle>(null);
  const [screen, setScreen] = useState<Screen>({ kind: "title" });
  const [collectedCount, setCollectedCount] = useState(0);
  const [characterState, setCharacterState] = useState<"idle" | "victory">("idle");
  const [isDialogueTyping, setIsDialogueTyping] = useState(false);
  const [characterTop, setCharacterTop] = useState(200);
  const [scrollY, setScrollY] = useState(0);
  const [animatingCoinId, setAnimatingCoinId] = useState<number | null>(null);
  const [animPhase, setAnimPhase] = useState<"burst" | "flying" | null>(null);
  const [rewardPhase, setRewardPhase] = useState<RewardPhase>("idle");
  // rewardPhase itself defaults to "idle" from mount, so this tracks whether
  // the gift should render at all — it should only appear once the warp
  // finishes, not alongside it.
  const [rewardSpawned, setRewardSpawned] = useState(false);
  const [warping, setWarping] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);
  const [rsvpError, setRsvpError] = useState<string | null>(null);
  const [payingFromMenu, setPayingFromMenu] = useState(false);
  const [menuPayError, setMenuPayError] = useState<string | null>(null);

  const isPreview = order.payment_status !== "paid";
  // Resolved from the order's template — drives character sprites,
  // decorations, ambient particles, and the sky gradient throughout. Falls
  // back to "space" for null/unrecognized values (getTheme in theme-config.ts).
  const theme = useMemo(() => getTheme(order.template), [order.template]);

  const deadlinePassed = useMemo(
    () => isPastDeadline(order.rsvp_deadline),
    [order.rsvp_deadline]
  );

  // Locked for every dialogue (not just modal-style ones): the dialogue box
  // now anchors its position to the character's current on-screen spot, so
  // the world underneath needs to hold still while it's showing. This also
  // covers the title screen itself (the initial state), so the tall world
  // underneath can't be dragged into view before "Start Mission" is pressed.
  const scrollLocked = screen.kind !== "none";

  useEffect(() => {
    if (!scrollLocked) {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      return;
    }
    // Setting overflow:hidden on body alone doesn't reliably stop touch
    // rubber-band scrolling on mobile Safari/Chrome — lock the root element
    // too and swallow touchmove outright while locked.
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    const preventTouchMove = (e: TouchEvent) => e.preventDefault();
    document.addEventListener("touchmove", preventTouchMove, { passive: false });
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.removeEventListener("touchmove", preventTouchMove);
    };
  }, [scrollLocked]);

  useEffect(() => {
    // Every mount (first play or a replay) starts the character at the top
    // of the path, regardless of whatever scroll position the previous
    // screen (e.g. the return-visit screen) left behind.
    window.scrollTo(0, 0);
    let raf = 0;
    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const sy = window.scrollY;
        const top = Math.min(sy + window.innerHeight * 0.35, WORLD_HEIGHT - CHARACTER_HEIGHT - 10);
        setCharacterTop(top);
        setScrollY(sy);
      });
    }
    onScroll(); // prime initial position (deferred via rAF, not synchronous)
    window.addEventListener("scroll", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const handleCoinTap = useCallback(
    (id: 1 | 2 | 3) => {
      if (screen.kind !== "none") return;
      if (id !== collectedCount + 1) return;
      if (animatingCoinId !== null) return;

      playSfx("coinCollect");
      setAnimatingCoinId(id);
      setCharacterState("victory");
      setAnimPhase("burst");
      setTimeout(() => setAnimPhase("flying"), 280);
      setTimeout(() => {
        setCollectedCount((c) => c + 1);
        setAnimatingCoinId(null);
        setAnimPhase(null);
        setCharacterState("idle");
        setScreen({ kind: "coin", coinId: id });
      }, 280 + 500);
    },
    [screen.kind, collectedCount, animatingCoinId]
  );

  function dismissCoinDialogue() {
    if (collectedCount >= 3) {
      // No separate "end zone" to travel to — the reward appears right where
      // the player already is. Lock scrolling for this automatic beat (warp,
      // then the capsule spawning in) instead of leaving it free-roam.
      const WARP_MS = 800;
      playSfx("warp");
      setScreen({ kind: "reward" });
      setWarping(true);
      setTimeout(() => {
        setWarping(false);
        // Ceremony beat before the gift — its onTalkingChange callback
        // below spawns the gift once this dialogue finishes typing out.
        setScreen({ kind: "missionCompleteIntro" });
      }, WARP_MS);
    } else {
      setScreen({ kind: "none" });
    }
  }

  function handleRewardTap() {
    if (rewardPhase !== "idle") return;
    // Long enough for the opened-gift art + confetti to actually register
    // before the mission-complete dialogue (with its Accept Invitation/RSVP
    // buttons) takes over — 350ms read as too abrupt in live testing.
    const OPEN_DISPLAY_MS = 1200;
    playSfx("giftOpen");
    setRewardPhase("opened");
    setCharacterState("victory");
    setShowConfetti(true);
    setTimeout(() => setScreen({ kind: "missionComplete" }), OPEN_DISPLAY_MS);
  }

  async function handleRsvpSubmit(values: RsvpFormValues) {
    setRsvpSubmitting(true);
    setRsvpError(null);
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestLink: order.guest_link,
          guestName: values.guestName,
          guestPhone: values.guestPhone,
          paxCount: values.paxCount,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setStoredRsvp(order.guest_link, {
        guestPhone: values.guestPhone,
        guestName: values.guestName,
        paxCount: values.paxCount,
      });
      playSfx("rsvpSuccess");
      onRsvpSuccess(data.rsvp);
    } catch (e) {
      setRsvpError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setRsvpSubmitting(false);
    }
  }

  // Same create-payment flow as the "Create e-card" button in /create's
  // review step, just reached from inside the game via the menu instead —
  // looked up by guest_link since that's the only identifier this
  // guest-facing client ever has (order_token stays server-side).
  async function handleProceedToPayment() {
    setPayingFromMenu(true);
    setMenuPayError(null);
    try {
      const res = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guest_link: order.guest_link }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      window.location.href = `https://toyyibpay.com/${data.billCode}`;
    } catch (err) {
      setMenuPayError(err instanceof Error ? err.message : "Something went wrong");
      setPayingFromMenu(false);
    }
  }

  const childName = order.child_name ?? "me";
  // Character's current viewport-relative head position — dialogues anchor just above this.
  const dialogueAnchorY = characterTop - scrollY + CHARACTER_HEIGHT * CHARACTER_HEAD_Y_RATIO;
  // The reward gift spawns right where the character is standing, not at
  // some fixed far-off world position.
  const rewardTop = characterTop + REWARD_OFFSET_FROM_CHARACTER;

  const tone = order.dialogue_tone ?? "excited";
  const openingSegments: DialogueSegment[] = [
    {
      text: fillTemplate(DIALOGUE_TONES[tone].opening, {
        name: childName,
        age: String(order.child_age ?? ""),
      }),
    },
  ];

  const coin1Segments: DialogueSegment[] = [];
  if (order.party_date) {
    coin1Segments.push({ text: "My party is on " });
    coin1Segments.push({ text: formatConversationalDate(order.party_date), highlight: true });
    coin1Segments.push({ text: "! " });
  }
  if (order.party_time) {
    coin1Segments.push({ text: "It starts at " });
    coin1Segments.push({ text: order.party_time, highlight: true });
    coin1Segments.push({ text: " — don't be late, okay?" });
  }

  const coin2Segments: DialogueSegment[] = [
    { text: "We're having it at " },
    { text: `${order.party_venue}`, highlight: true },
    { text: "! It's gonna be so fun — see you there!" },
  ];

  const coin3Segments: DialogueSegment[] = [
    { text: "Oh and guess what? Come dressed in " },
    { text: `${order.dress_code}`, highlight: true },
    { text: "!" },
  ];

  const missionCompleteSegments: DialogueSegment[] =
    gameMode === "replay"
      ? [{ text: "Yay, you found all the coins again! Thanks for playing!" }]
      : deadlinePassed
        ? [{ text: "RSVP is now closed. Please contact the host directly." }]
        : [{ text: DIALOGUE_TONES[tone].missionComplete }];

  const rsvpNoSegments: DialogueSegment[] = [
    { text: "Aw, we'll miss you! Hope to celebrate with you next time." },
  ];

  // Plain, non-typewritten, no highlighting/icon — deliberately distinct
  // from the structured tone-driven dialogue text around it, since this is
  // the parent's own verbatim words, not game copy.
  const personalMessageBlock = order.personal_message ? (
    <div className="mb-1 rounded-lg bg-black/20 p-3 text-left">
      <p className="ui-text-accent-light-80 font-display text-xs font-bold">{childName} says</p>
      <p className="font-body mt-1 text-sm text-slate-100">{order.personal_message}</p>
    </div>
  ) : null;

  return (
    <div className="relative">
      <AudioToggle ref={audioToggleRef} src={THEME_CONFIG.backgroundMusicSrc} />

      {/* Positioned below the coin-count HUD (also top-right, z-30) rather
          than overlapping it — opposite the mute button, same size/style. */}
      {screen.kind !== "title" && (
        <button
          type="button"
          onClick={() => {
            playSfx("buttonTap");
            setScreen({ kind: "menu" });
          }}
          aria-label="Menu"
          className="fixed top-16 z-[60] flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-xl leading-none text-white shadow-lg"
          style={{ right: frameInset(16) }}
        >
          ☰
        </button>
      )}

      <GameWorld
        character={order.character}
        characterState={characterState}
        characterTop={characterTop}
        scrollY={scrollY}
        starSeed={order.guest_link}
        collectedCount={collectedCount}
        animatingCoinId={animatingCoinId}
        animPhase={animPhase}
        onCoinTap={handleCoinTap}
        rewardPhase={screen.kind === "reward" && rewardSpawned ? rewardPhase : null}
        onRewardTap={handleRewardTap}
        rewardTop={rewardTop}
        theme={theme}
        showGameplayChrome={screen.kind !== "title"}
        warping={warping}
        talking={isDialogueTyping}
      />

      {showConfetti &&
        (screen.kind === "missionComplete" ||
          (screen.kind === "reward" && rewardPhase === "opened")) && <Confetti />}

      {screen.kind === "title" && (
        <TitleScreen
          childName={childName}
          character={order.character}
          theme={theme}
          onStart={() => {
            // First guaranteed user gesture on the page — the reliable spot
            // to actually start music, since mobile browsers silently block
            // unmuted autoplay on page load.
            audioToggleRef.current?.tryPlay();
            setScreen({ kind: "opening" });
          }}
        />
      )}

      {screen.kind === "opening" && (
        <DialogueBox
          theme={theme}
          photoUrl={order.child_photo_url}
          name={childName}
          anchorY={dialogueAnchorY}
          onTapDismiss={() => setScreen({ kind: "none" })}
          segments={openingSegments}
          onTalkingChange={setIsDialogueTyping}
        />
      )}

      {screen.kind === "coin" && screen.coinId === 1 && (
        <DialogueBox
          theme={theme}
          photoUrl={order.child_photo_url}
          name={childName}
          anchorY={dialogueAnchorY}
          onTapDismiss={dismissCoinDialogue}
          segments={coin1Segments}
          icon={ICONS.calendar}
          onTalkingChange={setIsDialogueTyping}
        />
      )}

      {screen.kind === "coin" && screen.coinId === 2 && (
        <DialogueBox
          theme={theme}
          photoUrl={order.child_photo_url}
          name={childName}
          anchorY={dialogueAnchorY}
          onTapDismiss={dismissCoinDialogue}
          segments={coin2Segments}
          icon={ICONS.location}
          onTalkingChange={setIsDialogueTyping}
        />
      )}

      {screen.kind === "coin" && screen.coinId === 3 && (
        <DialogueBox
          theme={theme}
          photoUrl={order.child_photo_url}
          name={childName}
          anchorY={dialogueAnchorY}
          onTapDismiss={dismissCoinDialogue}
          segments={coin3Segments}
          icon={ICONS.dresscode}
          onTalkingChange={setIsDialogueTyping}
        />
      )}

      {screen.kind === "missionCompleteIntro" && (
        <DialogueBox
          theme={theme}
          photoUrl={order.child_photo_url}
          name={childName}
          anchorY={dialogueAnchorY}
          segments={missionCompleteSegments}
          icon={ICONS.celebration}
          onTapDismiss={() => {}}
          onTalkingChange={(typing) => {
            setIsDialogueTyping(typing);
            if (typing) return;
            // Typing just finished (naturally or via skip-tap either way) —
            // a short beat, then the gift spawns and takes over the screen.
            setTimeout(() => {
              setRewardSpawned(true);
              setScreen({ kind: "reward" });
            }, 500);
          }}
        />
      )}

      {screen.kind === "missionComplete" && (
        <DialogueBox
          theme={theme}
          photoUrl={order.child_photo_url}
          name={childName}
          anchorY={dialogueAnchorY}
          segments={missionCompleteSegments}
          icon={ICONS.celebration}
          onTalkingChange={setIsDialogueTyping}
          footer={
            <>
              {personalMessageBlock}
              {gameMode === "replay" ? (
                <DialogueButton theme="space" onClick={onReplayDone}>
                  Back to my invite
                </DialogueButton>
              ) : deadlinePassed ? (
                <a
                  href={buildWhatsAppLink(
                    order.rsvp_phone_contact,
                    `Hi! Regarding ${childName}'s party...`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <DialogueButton type="button" theme="space" className="w-full">
                    WhatsApp the host
                  </DialogueButton>
                </a>
              ) : (
                <>
                  <DialogueButton theme="space" onClick={() => setScreen({ kind: "rsvpYes" })}>
                    Accept Invitation
                  </DialogueButton>
                  <DialogueButton
                    variant="secondary"
                    theme="space"
                    onClick={() => setScreen({ kind: "rsvpNo" })}
                  >
                    Maybe Next Time
                  </DialogueButton>
                </>
              )}
            </>
          }
        />
      )}

      {screen.kind === "rsvpYes" && (
        <DialogueBox
          theme={theme}
          photoUrl={order.child_photo_url}
          name={childName}
          anchorY={dialogueAnchorY}
          footer={null}
        >
          <RsvpForm
            theme="space"
            submitting={rsvpSubmitting}
            error={rsvpError}
            onSubmit={handleRsvpSubmit}
            previewLocked={isPreview}
          />
        </DialogueBox>
      )}

      {screen.kind === "rsvpNo" && (
        <DialogueBox
          theme={theme}
          photoUrl={order.child_photo_url}
          name={childName}
          anchorY={dialogueAnchorY}
          segments={rsvpNoSegments}
          onTalkingChange={setIsDialogueTyping}
          footer={
            <DialogueButton theme="space" onClick={() => setScreen({ kind: "rsvpYes" })}>
              Changed your mind? RSVP
            </DialogueButton>
          }
        />
      )}

      {screen.kind === "menu" && (
        <div
          className="fixed top-0 bottom-0 z-50 flex items-center justify-center px-6"
          style={{ left: frameInset(0), width: frameWidth(), ...themeUiStyle(theme) } as CSSProperties}
          onClick={() => setScreen({ kind: "none" })}
          role="button"
          tabIndex={0}
        >
          <div className="absolute inset-0 bg-black/50" aria-hidden />
          {/* Same paper-cutout card DialogueBox itself renders behind its text —
              reused directly here rather than a plain rectangle, so the menu
              still looks like it belongs to the rest of the game's UI. */}
          <div
            className="relative z-10 w-full max-w-xs p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialogue-paper-bg" aria-hidden />
            <div className="font-display relative z-10 flex flex-col gap-2.5">
              <h2 className="ui-text-accent-light mb-1 text-center text-base font-bold">Menu</h2>
              <DialogueButton
                theme="space"
                onClick={() => {
                  setMenuPayError(null);
                  setScreen({ kind: "eventDetails" });
                }}
              >
                View Event Details
              </DialogueButton>
              {isPreview && (
                <DialogueButton theme="space" disabled={payingFromMenu} onClick={handleProceedToPayment}>
                  {payingFromMenu ? "Redirecting…" : "Happy with it? Proceed to Payment"}
                </DialogueButton>
              )}
              {menuPayError && (
                <p className="text-center text-xs font-semibold text-red-400">{menuPayError}</p>
              )}
              <DialogueButton
                variant="secondary"
                theme="space"
                onClick={() => setScreen({ kind: "none" })}
              >
                Close
              </DialogueButton>
            </div>
          </div>
        </div>
      )}

      {screen.kind === "eventDetails" && (
        <DialogueBox
          theme={theme}
          photoUrl={order.child_photo_url}
          name={childName}
          anchorY={dialogueAnchorY}
          onTapDismiss={() => setScreen({ kind: "none" })}
        >
          {/* Static (no typewriter) — jumps straight to the info instead of
              replaying the coin-collection sequence, reusing the same
              icon+highlight rows the coin dialogues use. */}
          <div className="flex flex-col gap-3 text-left">
            {(order.party_date || order.party_time) && (
              <div className="flex items-start gap-2">
                <span className="ui-text-accent mt-0.5 shrink-0">{ICONS.calendar}</span>
                <p>
                  {order.party_date && (
                    <>
                      My party is on{" "}
                      <span className="dialogue-highlight">
                        {formatConversationalDate(order.party_date)}
                      </span>
                      !{" "}
                    </>
                  )}
                  {order.party_time && (
                    <>
                      It starts at{" "}
                      <span className="dialogue-highlight">
                        {order.party_time}
                      </span>
                      .
                    </>
                  )}
                </p>
              </div>
            )}
            <div className="flex items-start gap-2">
              <span className="ui-text-accent mt-0.5 shrink-0">{ICONS.location}</span>
              <p>
                We&apos;re having it at{" "}
                <span className="dialogue-highlight">
                  {order.party_venue}
                </span>
                !
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="ui-text-accent mt-0.5 shrink-0">{ICONS.dresscode}</span>
              <p>
                Come dressed in{" "}
                <span className="dialogue-highlight">
                  {order.dress_code}
                </span>
                !
              </p>
            </div>
          </div>
        </DialogueBox>
      )}
    </div>
  );
}
