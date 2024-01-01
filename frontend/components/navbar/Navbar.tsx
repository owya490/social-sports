"use client";

import { useEffect, useState } from "react";
import Logo from "./Logo";
import ProfilePic from "./ProfilePic";
import SearchBar from "./SearchBar";

export default function Navbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };
  const [isHome, setIsHome] = useState(true);
  useEffect(() => {
    setIsHome(window.location.pathname === "/");
  }, []);
  return (
    <div
      className={
        isHome ? "hidden" : "bg-white drop-shadow-lg fixed top-0 w-screen z-50"
      }
    >
      <div className="flex items-center py-2 px-5 lg:px-10 xl:px-20">
        <Logo />
        <SearchBar />
        <div className="ml-auto flex items-center">
          <button
            className="border border-black px-3 py-2 rounded-lg mx-5 max-h-[40px] hidden lg:block"
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
