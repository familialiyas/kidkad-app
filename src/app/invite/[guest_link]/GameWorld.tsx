"use client";

import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  COINS,
  WORLD_HEIGHT,
  CHARACTER_WIDTH,
  CHARACTER_HEIGHT,
  REWARD_SIZE,
  RewardPhase,
} from "@/lib/game-constants";
import { generateStars, STAR_PARALLAX_FACTOR } from "@/lib/starfield";
import { generateDecorations, DECORATION_PARALLAX_FACTOR } from "@/lib/decorations";
import { THEME_CONFIG } from "@/lib/theme-config";
import type { Character } from "@/lib/types";

type CoinVisualPhase = "locked" | "active" | "burst" | "flying" | "collected";

export default function GameWorld({
  character,
  characterState,
  characterTop,
  scrollY,
  collectedCount,
  animatingCoinId,
  animPhase,
  onCoinTap,
  rewardPhase,
  onRewardTap,
  rewardTop,
  starSeed,
  showGameplayChrome = true,
  warping = false,
  talking = false,
}: {
  character: Character | null;
  characterState: "idle" | "victory";
  characterTop: number;
  scrollY: number;
  collectedCount: number;
  animatingCoinId: number | null;
  animPhase: "burst" | "flying" | null;
  onCoinTap: (id: 1 | 2 | 3) => void;
  /** null hides the reward gift entirely (not earned yet, or already claimed). */
  rewardPhase: RewardPhase | null;
  onRewardTap: () => void;
  /** World-Y position for the gift — spawns right at the character, not a fixed far-off spot. */
  rewardTop: number;
  /** Seeds the star field so the same invite always shows the same pattern. */
  starSeed: string;
  /** False during the title screen — the sprite and HUD live there separately, avoid double-rendering. */
  showGameplayChrome?: boolean;
  /** Briefly stretches the stars into streaks (warp speed) on the way to mission complete. */
  warping?: boolean;
  /** True while dialogue text is actively typing — plays a talking loop instead of the idle float. */
  talking?: boolean;
}) {
  const sprites =
    character === "girl" ? THEME_CONFIG.characterSprites.girl : THEME_CONFIG.characterSprites.boy;
  const spriteSrc = characterState === "victory" ? sprites.yay : sprites.idle;

  const stars = useMemo(() => generateStars(starSeed, WORLD_HEIGHT), [starSeed]);
  const decorations = useMemo(() => generateDecorations(starSeed, WORLD_HEIGHT), [starSeed]);
  // Each background layer scrolls slower than the foreground (parallax): a
  // layer only moves (1 - factor) of the true scroll distance, achieved by
  // shifting it the opposite way by that remainder so its net on-screen
  // movement is reduced. Stars (0.6) sit furthest back, decorations (0.8) in
  // the middle, and gameplay elements (character/coins) move at 100% (no
  // compensating offset) since they're the closest layer.
  const starLayerOffset = scrollY * (1 - STAR_PARALLAX_FACTOR);
  const decorationLayerOffset = scrollY * (1 - DECORATION_PARALLAX_FACTOR);

  // Precisely aims the coin-fly animation at the HUD counter's actual
  // screen position (not a guessed vw/vh offset), and pins the flying coin
  // to that measured spot via position:fixed so it can't drift off target
  // if the page happens to scroll mid-flight.
  const hudRef = useRef<HTMLDivElement>(null);
  const coinRefs = useRef<Partial<Record<number, HTMLButtonElement>>>({});
  const [flyingCoinFixedPos, setFlyingCoinFixedPos] = useState<{
    top: number;
    left: number;
    dx: number;
    dy: number;
  } | null>(null);

  useLayoutEffect(() => {
    if (animPhase !== "flying" || animatingCoinId === null) {
      // Deferred (not a bare synchronous call) — this branch is just
      // clearing stale state, not the timing-sensitive pre-paint
      // measurement the "flying" branch below needs.
      Promise.resolve().then(() => setFlyingCoinFixedPos(null));
      return;
    }
    const coinEl = coinRefs.current[animatingCoinId];
    const hudEl = hudRef.current;
    if (!coinEl || !hudEl) return;
    const coinRect = coinEl.getBoundingClientRect();
    const hudRect = hudEl.getBoundingClientRect();
    setFlyingCoinFixedPos({
      top: coinRect.top,
      left: coinRect.left,
      dx: hudRect.left + hudRect.width / 2 - (coinRect.left + coinRect.width / 2),
      dy: hudRect.top + hudRect.height / 2 - (coinRect.top + coinRect.height / 2),
    });
  }, [animPhase, animatingCoinId]);

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        height: WORLD_HEIGHT,
        background: "linear-gradient(to top, #0a0e27 0%, #1a1f4e 100%)",
      }}
    >
      {/* Parallax star field — moves slower than the foreground for depth */}
      <div
        className="pointer-events-none absolute top-0 left-0 h-full w-full"
        style={{ transform: `translateY(${starLayerOffset}px)` }}
        aria-hidden
      >
        {stars.map((star) => (
          <span
            key={star.id}
            className={`absolute rounded-full bg-white ${warping ? "star-warp" : ""}`}
            style={{
              top: star.top,
              left: `${star.leftPct}%`,
              width: star.size,
              height: star.size,
              opacity: star.opacity,
            }}
          />
        ))}
      </div>

      {/* Stardust trail — a soft glowing guide down the center, not a solid road */}
      <div
        className="absolute top-0 left-1/2 h-full w-9 -translate-x-1/2"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(191, 219, 254, 0.35) 50%, transparent 100%)",
        }}
        aria-hidden
      />

      {/* Margin decorations — middle parallax depth: slower than gameplay, faster than stars */}
      <div
        className="pointer-events-none absolute top-0 left-0 z-0 h-full w-full"
        style={{ transform: `translateY(${decorationLayerOffset}px)` }}
        aria-hidden
      >
        {decorations.map((deco) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={deco.id}
            src={deco.src}
            alt=""
            className="decoration-float absolute select-none"
            style={
              {
                top: deco.top,
                [deco.side]: `${deco.insetPct}%`,
                width: deco.width,
                height: deco.height,
                animationDuration: `${deco.floatDurationS}s`,
                animationDelay: `${deco.floatDelayS}s`,
                "--deco-rot": `${deco.baseRotationDeg}deg`,
                "--deco-scale": deco.baseScale,
              } as CSSProperties
            }
          />
        ))}
      </div>

      {/* HUD */}
      {showGameplayChrome && (
        <div
          ref={hudRef}
          className="fixed top-4 right-4 z-30 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-white shadow-lg"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={THEME_CONFIG.coinSprites.glow}
            alt=""
            className="h-6 w-6 object-contain"
            aria-hidden
          />
          <span className="font-display text-sm font-bold tabular-nums">{collectedCount} / 3</span>
        </div>
      )}

      {/* Coins */}
      {showGameplayChrome && COINS.map((coin) => {
        let phase: CoinVisualPhase;
        if (collectedCount >= coin.id && animatingCoinId !== coin.id) {
          phase = "collected";
        } else if (animatingCoinId === coin.id && animPhase) {
          phase = animPhase;
        } else if (coin.id === collectedCount + 1) {
          phase = "active";
        } else {
          phase = "locked";
        }

        if (phase === "collected") return null;

        const sideStyle = coin.side === "left" ? { left: "12%" } : { right: "12%" };
        // Burst art shows only for the ~300ms burst phase; every other
        // visible phase (locked/active/flying) uses the normal glow coin.
        const coinSrc =
          phase === "burst" ? THEME_CONFIG.coinSprites.burst : THEME_CONFIG.coinSprites.glow;

        // Once flying, switch out of the scrolling world's coordinate
        // system (position: fixed, pinned to the exact spot it was at) so
        // the aim at the HUD stays accurate even if the page scrolls mid-flight.
        const flyingStyle =
          phase === "flying" && flyingCoinFixedPos
            ? ({
                position: "fixed",
                top: flyingCoinFixedPos.top,
                left: flyingCoinFixedPos.left,
                "--fly-dx": `${flyingCoinFixedPos.dx}px`,
                "--fly-dy": `${flyingCoinFixedPos.dy}px`,
              } as CSSProperties)
            : { top: coin.top, ...sideStyle };

        return (
          <button
            key={coin.id}
            ref={(el) => {
              coinRefs.current[coin.id] = el ?? undefined;
            }}
            type="button"
            disabled={phase !== "active"}
            onClick={() => onCoinTap(coin.id)}
            aria-label={`Coin: ${coin.label}`}
            className={[
              "absolute z-10 flex h-14 w-14 items-center justify-center rounded-full transition-transform",
              phase === "active" ? "coin-glow cursor-pointer" : "",
              phase === "locked" ? "opacity-40 grayscale" : "",
              phase === "burst" ? "coin-burst" : "",
              phase === "flying" ? "coin-fly" : "",
            ].join(" ")}
            style={flyingStyle}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coinSrc} alt="" className="h-full w-full select-none object-contain" />
          </button>
        );
      })}

      {/* Reward gift — appears once all 3 coins are collected; tap to open */}
      {rewardPhase && (
        <button
          type="button"
          disabled={rewardPhase !== "idle"}
          onClick={onRewardTap}
          aria-label="Reward gift"
          className={[
            "absolute z-10",
            rewardPhase === "idle" ? "gift-idle cursor-pointer" : "gift-pop",
          ].join(" ")}
          style={{
            top: rewardTop,
            left: "50%",
            transform: "translateX(-50%)",
            width: REWARD_SIZE,
            height: REWARD_SIZE,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              rewardPhase === "opened"
                ? THEME_CONFIG.rewardSprites.opened
                : THEME_CONFIG.rewardSprites.closed
            }
            alt=""
            className="h-full w-full select-none object-contain"
          />
        </button>
      )}

      {/* Character */}
      {showGameplayChrome && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={spriteSrc}
          alt=""
          className={`absolute z-20 select-none ${
            characterState === "victory"
              ? "character-victory"
              : talking
                ? "character-talk"
                : "character-float"
          }`}
          style={{
            top: characterTop,
            left: "50%",
            transform: "translateX(-50%)",
            width: CHARACTER_WIDTH,
            height: CHARACTER_HEIGHT,
          }}
          aria-hidden
          data-testid="character-sprite"
        />
      )}
    </div>
  );
}
