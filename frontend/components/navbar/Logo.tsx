import Image from "next/image";
import LogoImage from "./../../public/images/SportsHubBlackLogo.svg";
import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center">
      <Image priority={true} src={LogoImage} alt="Logo" width={0} height={0} className="w-60 h-10" />
    </Link>
  );
}
