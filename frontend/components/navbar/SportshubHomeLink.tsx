import Logo from "@/public/images/BlackLogo.svg";
import Image from "next/image";
import Link from "next/link";

export function SportshubHomeLink({
  onClick,
  className = "",
  imageClassName = "h-8 w-auto",
  priority = false,
}: {
  onClick?: () => void;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
}) {
  return (
    <Link
      href="/"
      onClick={onClick}
      aria-label="SPORTSHUB home"
      className={`inline-flex shrink-0 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${className}`}
    >
      <Image src={Logo} alt="" priority={priority} className={imageClassName} />
    </Link>
  );
}
