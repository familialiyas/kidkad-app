// Same inline-SVG language as invite/[guest_link]/PartyIcons.tsx (stroke
// currentColor, rounded caps/joins) — new icons for the landing page's
// "How It Works" steps, not shared with the game itself.
type IconProps = { className?: string };

export function GlobeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12h18M12 3c2.5 2.5 3.75 6 3.75 9s-1.25 6.5-3.75 9c-2.5-2.5-3.75-6-3.75-9S9.5 5.5 12 3Z"
      />
    </svg>
  );
}

export function EditIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5.5" />
    </svg>
  );
}

export function SendIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3 3l18 9-18 9 3-9Zm0 0h13" />
    </svg>
  );
}

export function CompassIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.5 9.5-2 5-3 2 2-5 3-2Z" />
    </svg>
  );
}

export function ChartIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21V9m6 12V6m6 15v-8m6 8V3" />
    </svg>
  );
}
