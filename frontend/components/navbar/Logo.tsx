import Image from "next/image";
import Link from "next/link";
import LogoImage from "./../../public/icons/Icon_black_square.png";

export default function Logo({
  showText = false,
  size = "default",
}: {
  showText?: boolean;
  size?: "default" | "sm";
}) {
  const small = size === "sm";

  return (
    <Link href="/" className={`flex items-center ${small ? "gap-1.5" : "gap-2"}`}>
      <Image
        priority={true}
        src={LogoImage}
        alt="SPORTSHUB - Find and book social sports events"
        width={small ? 32 : 48}
        height={small ? 32 : 48}
        className={`${small ? "h-8 w-8" : "h-12 w-12"} aspect-square object-contain`}
      />
      {showText && (
        <span
          className={`${small ? "h-8 text-[2rem]" : "h-12 text-[3rem]"} font-sans font-semibold uppercase leading-none text-core-text`}
        >
          SPORTSHUB
        </span>
      )}
    </Link>
  );
}
