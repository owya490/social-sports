import Image from "next/image";
import Link from "next/link";
import LogoImage from "./../../public/icons/Icon_black_square.png";

export default function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center mr-12">
      <Image priority={true} src={LogoImage} alt="Logo" width={0} height={0} className="w-12" />
    </Link>
  );
}
