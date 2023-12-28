import Image from "next/image";
import Logo from "./../public/images/SportsHubMobileLogo.png";

export default function Loading() {
  return (
    <div className="h-screen w-screen flex justify-center items-center">
      <div className="animate-spin-slow">
        <Image src={Logo} alt="Logo" width={50} height={50} className="w-12" />
      </div>
    </div>
  );
}
