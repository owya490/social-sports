"use client";

import Image from "next/image";
import { useState } from "react";
import Logo from "./../public/images/Logo.png";
import ProfilePic from "./ProfilePic";
import SearchBar from "./SearchBar";

export default function Navbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="bg-white drop-shadow-lg fixed top-0 w-screen z-50">
      <div className="flex items-center py-2 px-10">
        <div className="flex items-center">
          <Image
            src={Logo}
            alt="Logo"
            width={50}
            height={50}
            className="w-12 mx-1"
          />
          <h1 className="font-robotocondensed text-3xl font-extrabold mr-10">
            SOCIAL SPORTS
          </h1>
        </div>
        <SearchBar />
        <div className="ml-auto flex items-center">
          <button
            className="border border-black px-3 py-2 rounded-full mx-5 max-h-[40px]"
            onClick={(e) => {
              window.open("https://www.google.com", "_self");
            }}
          >
            Create Event
          </button>
          <div className="mt-1">
            <ProfilePic />
          </div>
        </div>
      </div>
      <div className="h-[1px] bg-black"></div>
    </div>
  );
}
