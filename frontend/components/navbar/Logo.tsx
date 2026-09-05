import Image from "next/image";
import Link from "next/link";
import LogoImage from "./../../public/icons/Icon_black_square.png";

const LOGO_SIZES = {
  sm: {
    gap: "gap-1.5",
    image: { width: 24, height: 24, className: "h-5 w-5 sm:h-6 sm:w-6" },
    text: "text-lg",
  },
  md: {
    gap: "gap-2",
    image: { width: 48, height: 48, className: "h-12 w-12" },
    text: "text-[2.25rem]",
  },
  lg: {
    gap: "gap-3",
    image: { width: 64, height: 64, className: "h-16 w-16" },
    text: "text-[3rem]",
  },
} as const;

export default function Logo({
  showText = false,
  size = "md",
}: {
  showText?: boolean;
  size?: keyof typeof LOGO_SIZES;
}) {
  const { gap, image, text } = LOGO_SIZES[size];

  return (
    <Link href="/" className={`flex items-center ${gap}`}>
      <Image
        priority={true}
        src={LogoImage}
        alt="SPORTSHUB - Find and book social sports events"
        width={image.width}
        height={image.height}
        className={`${image.className} aspect-square object-contain`}
      />
      {showText && (
        <span className={`${text} font-sans font-semibold uppercase leading-none text-core-text`}>SPORTSHUB</span>
      )}
    </Link>
  );
}
