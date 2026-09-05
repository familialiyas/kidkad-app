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
        >
          {order.personal_message}
        </DialogueBox>
      )}

      {screen.kind === "coin" && screen.coinId === 1 && (
        <DialogueBox
          photoUrl={order.child_photo_url}
          name={childName}
          anchorY={dialogueAnchorY}
          onTapDismiss={dismissCoinDialogue}
        >
          <p>
            {order.party_date && `My party is on ${formatConversationalDate(order.party_date)}! `}
            {order.party_time && `It starts at ${order.party_time} — don't be late, okay?`}
          </p>
        </DialogueBox>
      )}

      {screen.kind === "coin" && screen.coinId === 2 && (
        <DialogueBox
          photoUrl={order.child_photo_url}
          name={childName}
          anchorY={dialogueAnchorY}
          onTapDismiss={dismissCoinDialogue}
        >
          <p>{`We're having it at ${order.party_venue}! It's gonna be so fun — see you there!`}</p>
        </DialogueBox>
      )}

      {screen.kind === "coin" && screen.coinId === 3 && (
        <DialogueBox
          photoUrl={order.child_photo_url}
          name={childName}
          anchorY={dialogueAnchorY}
          onTapDismiss={dismissCoinDialogue}
        >
          <p>{`Oh and guess what? Come dressed in ${order.dress_code}!`}</p>
        </DialogueBox>
      )}

      {screen.kind === "missionComplete" && (
        <DialogueBox
          photoUrl={order.child_photo_url}
          name={childName}
          anchorY={dialogueAnchorY}
          footer={
            gameMode === "replay" ? (
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
            )
          }
        >
          {gameMode === "replay" ? (
            <p>Yay, you found all the coins again! Thanks for playing!</p>
          ) : deadlinePassed ? (
            <p>RSVP is now closed. Please contact the host directly.</p>
          ) : (
            <p>
              Yay, you found all the coins! Here&apos;s your reward — a special invitation to
              my birthday party! Will you come?
            </p>
          )}
        </DialogueBox>
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
          footer={
            <DialogueButton theme="space" onClick={() => setScreen({ kind: "rsvpYes" })}>
              Changed your mind? RSVP
            </DialogueButton>
          }
        >
          <p>Aw, we&apos;ll miss you! Hope to celebrate with you next time.</p>
        </DialogueBox>
      )}
    </div>
  );
}
