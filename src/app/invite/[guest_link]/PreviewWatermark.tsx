// Enough repeats to keep the tiled grid dense at any viewport size once
// rotated — flex-wrap just stops once it runs out of items, so this errs
// generous rather than leaving gaps on a large screen.
const TILE_COUNT = 260;
const TILES = Array.from({ length: TILE_COUNT });

/** Shown across the whole page whenever the order hasn't been paid for yet — pointer-events-none so it never blocks the game underneath, tiled like a stock-photo watermark so the art underneath stays clearly visible. */
export default function PreviewWatermark() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-30 overflow-hidden select-none"
      aria-hidden
    >
      {/* Oversized (200vw/200vh) and centered so the rotated grid still
          fully covers every corner of the viewport. */}
      <div
        className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 -rotate-[30deg] flex-wrap content-start gap-x-8 gap-y-6"
        style={{ width: "200vw", height: "200vh" }}
      >
        {TILES.map((_, i) => (
          <span
            key={i}
            className="font-display whitespace-nowrap text-xs font-bold tracking-wider text-white/15 uppercase sm:text-sm"
          >
            KidKad Preview
          </span>
        ))}
      </div>
    </div>
  );
}
