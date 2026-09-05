import Image from "next/image";
import Link from "next/link";
import LogoImage from "./../../public/icons/Icon_black_square.png";

export default function Logo({ showText = false }: { showText?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2">
      <Image
        priority={true}
        src={LogoImage}
        alt="SPORTSHUB - Find and book social sports events"
        width={48}
        height={48}
        className="h-12 w-12 aspect-square object-contain"
      />
      {showText && (
        <span className="h-12 font-sans text-[3rem] font-semibold uppercase leading-none text-core-text">
          SPORTSHUB
        </span>
      )}
    </Link>
  );
}
