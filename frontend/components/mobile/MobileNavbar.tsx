"use client";
import Image from "next/image";
import ProfilePic from "../navbar/ProfilePic";
import Logo from "./../../public/images/SportsHubMobileLogo.png";
import MobileSearchDialog from "./MobileSearchDialog";

export default function MobileNavbar() {
  return (
    <div className="bg-white drop-shadow-lg fixed top-0 w-screen z-50">
      <div className="flex items-center py-2 px-4">
        <a href="/dashboard">
          <Image
            src={Logo}
            alt="Logo"
            width={50}
            height={50}
            className="w-12 mr-2"
          />
        </a>

        <div className="w-[50%]">
          {/* <MobileSearchBar /> */}
          <MobileSearchDialog />
        </div>
        <div className="flex ml-auto items-center">
          <ProfilePic />
        </div>
      </div>
      {/* <div className="rounded-full w-10 h-10 bg-red-200 ml-auto"></div> */}
      <div className="h-[1px] bg-black"></div>
    </div>
  );
}
