"use client";

import { useState } from "react";
import Logo from "./Logo";
import ProfilePic from "./ProfilePic";
import SearchBar from "./SearchBar";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };
  const router = useRouter();

  return (
    <div className="bg-white drop-shadow-lg fixed top-0 w-screen z-50">
      <div className="flex items-center py-2 px-5 lg:px-8 xl:px-12">
        <Logo />
        <SearchBar />
        <div className="ml-auto flex items-center">
          <ProfilePic />
        </div>
      </div>
      <div className="h-[1px] bg-black"></div>
    </div>
  );
}
