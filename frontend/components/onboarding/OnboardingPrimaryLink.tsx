import Link from "next/link";
import type { ComponentProps } from "react";

const primaryLinkClass =
  "inline-flex h-10 items-center justify-center rounded-full bg-core-text px-4 text-sm font-semibold text-white transition-colors duration-300 hover:bg-black";

/** Primary pill link — matches organiser/attendee `HighlightButton` primary styling. */
export function OnboardingPrimaryLink({
  className = "",
  ...props
}: ComponentProps<typeof Link>) {
  return <Link className={[primaryLinkClass, className].filter(Boolean).join(" ")} {...props} />;
}
