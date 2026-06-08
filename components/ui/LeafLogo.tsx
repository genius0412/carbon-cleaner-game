/**
 * The Carbon Cleaner leaf mark (matches app/icon.svg). Inherits its color from
 * `currentColor`, so set the size + color via className, e.g.
 *   <LeafLogo className="h-5 w-5 text-leaf" />
 */
export function LeafLogo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      role="img"
      aria-label="Carbon Cleaner"
    >
      <path
        d="M7 25C7 13 16 6 26 6C26 18 18 26 7 25Z"
        fill="currentColor"
      />
      <path
        d="M9 24C14 19 19 14 24 9"
        stroke="rgba(7,11,10,0.55)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
