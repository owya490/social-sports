import Image from "next/image";
import Link from "next/link";
import LogoImage from "./../../public/icons/Icon_black_square.png";

export default function Logo() {
  return (
    <Link href="/" className="flex items-center">
      <Image
        priority={true}
        src={LogoImage}
        alt="SPORTSHUB - Find and book social sports events"
        width={0}
        height={0}
        className="w-12"
      />
    </Link>
  );
}
