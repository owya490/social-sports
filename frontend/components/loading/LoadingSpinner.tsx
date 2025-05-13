import Image from "next/image";
import Logo from "./../../public/images/BlackLogo.svg";

export const LoadingSpinner = () => {
  return (
    <div className="animate-spin-slow">
      <Image src={Logo} alt="Logo" width={50} height={50} className="w-12" />
    </div>
  );
};
