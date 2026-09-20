/** Shown across the whole page whenever the order hasn't been paid for yet — pointer-events-none so it never blocks the game underneath. */
export default function PreviewWatermark() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center overflow-hidden select-none"
      aria-hidden
    >
      <p className="font-display -rotate-[20deg] whitespace-nowrap text-4xl font-black text-white/25 drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)] sm:text-5xl">
        KidKad Preview
      </p>
    </div>
  );
}
