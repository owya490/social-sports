import Image from "next/image";
import LogoImage from "./../../public/images/Logo.png";

export default function Logo() {
  return (
    <a href="/dashboard" className="flex items-center">
      <Image
        src={LogoImage}
        alt="Logo"
        width={50}
        height={50}
        className="w-12 mx-1"
      />
      <h1 className="font-robotocondensed text-3xl font-extrabold mr-10">
        SOCIAL SPORTS
      </h1>
    </a>
  );
}
