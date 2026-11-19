import { SportshubMark } from "@/components/elements/SportshubMark";
import Link from "next/link";

export function SportshubHomeLink({
  onClick,
  className = "",
  imageClassName = "h-8 w-auto",
}: {
  onClick?: () => void;
  className?: string;
  imageClassName?: string;
}) {
  return (
    <Link
      href="/"
      onClick={onClick}
      aria-label="SPORTSHUB home"
      className={`sportshub-mark-trigger inline-flex shrink-0 rounded-xl text-core-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${className}`}
    >
      <SportshubMark className={imageClassName} />
    </Link>
  );
}
