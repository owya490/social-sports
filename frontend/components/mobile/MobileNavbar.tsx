"use client";
import Image from "next/image";
import ProfilePic from "../navbar/ProfilePic";
import Logo from "./../../public/images/Logo.png";

export default function MobileNavbar() {
  return (
    <div className="bg-white drop-shadow-lg fixed top-0 w-screen z-50">
      <a className="flex items-center py-2 px-4" href="/dashboard">
        <Image
          src={Logo}
          alt="Logo"
          width={50}
          height={50}
          className="w-12 mx-1"
        />
        <h1 className="font-robotocondensed text-2xl font-extrabold mr-20">
          SOCIAL SPORTS
        </h1>

        <div className="flex ml-auto items-center">
          <ProfilePic />
        </div>

        {/* <div className="rounded-full w-10 h-10 bg-red-200 ml-auto"></div> */}
      </a>
      <div className="h-[1px] bg-black"></div>
    </div>
  );
}
