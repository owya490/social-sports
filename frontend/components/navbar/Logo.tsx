import { SportshubMark } from "@/components/elements/SportshubMark";
import Link from "next/link";

const LOGO_SIZES = {
  sm: {
    gap: "gap-1.5",
    mark: "h-5 w-5 sm:h-6 sm:w-6",
    text: "text-lg",
  },
  md: {
    gap: "gap-2",
    mark: "h-12 w-12",
    text: "text-[2.25rem]",
  },
  lg: {
    gap: "gap-3",
    mark: "h-16 w-16",
    text: "text-[3rem]",
  },
} as const;

export default function Logo({
  showText = false,
  size = "md",
  linkToHome = true,
}: {
  showText?: boolean;
  size?: keyof typeof LOGO_SIZES;
  linkToHome?: boolean;
}) {
  const { gap, mark, text } = LOGO_SIZES[size];
  const className = `sportshub-mark-trigger flex items-center text-core-text ${gap}`;
  const content = (
    <>
      <SportshubMark label="SPORTSHUB - Find and book social sports events" className={mark} />

      {showText && (
        <span className={`${text} font-sans font-semibold uppercase leading-none text-core-text`}>SPORTSHUB</span>
      )}
    </>
  );

  return linkToHome ? (
    <Link href="/" className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}
