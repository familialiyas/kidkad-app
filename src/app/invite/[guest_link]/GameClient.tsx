"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PublicOrder, Rsvp } from "@/lib/types";
import { getStoredRsvp, setStoredRsvp } from "@/lib/rsvp-storage";
import { isPastDeadline, formatConversationalDate } from "@/lib/date";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import {
  WORLD_HEIGHT,
  CHARACTER_HEIGHT,
  CHARACTER_HEAD_Y_RATIO,
  REWARD_OFFSET_FROM_CHARACTER,
  RewardPhase,
} from "@/lib/game-constants";
import GameWorld from "./GameWorld";
import DialogueBox from "./DialogueBox";
import DialogueButton from "./DialogueButton";
import Confetti from "./Confetti";
import RsvpForm, { RsvpFormValues } from "./RsvpForm";
import ReturnVisitScreen from "./ReturnVisitScreen";
import TitleScreen from "./TitleScreen";
import AudioToggle, { AudioToggleHandle } from "./AudioToggle";
import { THEME_CONFIG } from "@/lib/theme-config";
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
  | { kind: "missionComplete" }
  | { kind: "rsvpYes" }
  | { kind: "rsvpNo" };

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

  if (mode === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-green-700 text-white">
        Loading...
      </div>
    );
  }

  if (mode === "returnVisit" && returnRsvp) {
    return (
      <ReturnVisitScreen
        order={order}
        rsvp={returnRsvp}
        onPlayAgain={() => {
          setGameMode("replay");
          setMode("game");
        }}
      />
    );
  }

  // The moment a guest submits their RSVP, they land on the same
  // ReturnVisitScreen a reopened link would show — that's the one place
  // with the "You're in!" event details and the calendar/maps actions.
  // Switching `mode` away from "game" unmounts <Game> entirely, so every
  // fresh mount (initial play or a replay) starts with clean state for free.
  return (
    <Game
      order={order}
      mode={gameMode}
      onRsvpSuccess={(rsvp) => {
        setReturnRsvp(rsvp);
        setMode("returnVisit");
      }}
      onReplayDone={() => setMode("returnVisit")}
    />
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

  const deadlinePassed = useMemo(
    () => isPastDeadline(order.rsvp_deadline),
    [order.rsvp_deadline]
  );

  // Locked for every dialogue (not just modal-style ones): the dialogue box
  // now anchors its position to the character's current on-screen spot, so
  // the world underneath needs to hold still while it's showing.
  const scrollLocked = screen.kind !== "none";

  useEffect(() => {
    document.body.style.overflow = scrollLocked ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
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
        setRewardSpawned(true); // now the gift mounts and plays its entrance animation
      }, WARP_MS);
    } else {
      setScreen({ kind: "none" });
    }
  }

  function handleRewardTap() {
    if (rewardPhase !== "idle") return;
    const OPEN_DISPLAY_MS = 350; // gift-opened art shown briefly before the dialogue takes over
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
        : [
            {
              text: "Yay, you found all the coins! Here's your reward — a special invitation to my birthday party! Will you come?",
            },
          ];

  const rsvpNoSegments: DialogueSegment[] = [
    { text: "Aw, we'll miss you! Hope to celebrate with you next time." },
  ];

  // Plain, non-typewritten, no highlighting/icon — deliberately distinct
  // from the structured tone-driven dialogue text around it, since this is
  // the parent's own verbatim words, not game copy.
  const personalMessageBlock = order.personal_message ? (
    <div className="mb-1 rounded-lg bg-black/20 p-3 text-left">
      <p className="font-display text-xs font-bold text-cyan-300/80">{childName} says</p>
      <p className="font-body mt-1 text-sm text-slate-100">{order.personal_message}</p>
    </div>
  ) : null;

  return (
    <div className="relative">
      <AudioToggle ref={audioToggleRef} src={THEME_CONFIG.backgroundMusicSrc} />
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
          photoUrl={order.child_photo_url}
          name={childName}
          anchorY={dialogueAnchorY}
          onTapDismiss={dismissCoinDialogue}
          segments={coin3Segments}
          icon={ICONS.dresscode}
          onTalkingChange={setIsDialogueTyping}
        />
      )}

      {screen.kind === "missionComplete" && (
        <DialogueBox
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
          />
        </DialogueBox>
      )}

      {screen.kind === "rsvpNo" && (
        <DialogueBox
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
    </div>
  );
}
