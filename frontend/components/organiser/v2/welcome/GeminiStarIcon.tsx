import type { SVGProps } from "react";

/** Four-point sparkle — Gemini-style mark for welcome reveal and tour accents. */
export function GeminiStarIcon({
  className,
  solid = false,
  ...props
}: SVGProps<SVGSVGElement> & { solid?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={solid ? "currentColor" : "none"}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
      {...props}
    >
      <path
        d="M12 2.5c.35 3.6 1.9 5.15 5.5 5.5-3.6.35-5.15 1.9-5.5 5.5-.35-3.6-1.9-5.15-5.5-5.5 3.6-.35 5.15-1.9 5.5-5.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M18.25 14.25c.18 1.85.98 2.65 2.83 2.83-1.85.18-2.65.98-2.83 2.83-.18-1.85-.98-2.65-2.83-2.83 1.85-.18 2.65-.98 2.83-2.83Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
    </svg>
  );
}
