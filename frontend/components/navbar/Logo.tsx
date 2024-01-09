import Image from "next/image";
import LogoImage from "./../../public/images/SportsHubLogo.png";

export default function Logo() {
  return (
    <a href="/dashboard" className="flex items-center">
      <Image
        priority={true}
        src={LogoImage}
        alt="Logo"
        width={0}
        height={0}
        className="w-80 mr-8"
      />
    </a>
  );
}
