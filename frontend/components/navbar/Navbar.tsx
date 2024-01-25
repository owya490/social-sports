"use client";

import Logo from "./Logo";
import ProfilePic from "./ProfilePic";
import SearchBar from "./SearchBar";

export default function Navbar() {
  return (
    <div className="bg-white drop-shadow-lg fixed top-0 w-screen z-50">
      <div className="flex items-center py-2 px-5 lg:px-8 xl:px-12">
        <Logo />
        <SearchBar />
        <ProfilePic />
      </div>
      <div className="h-[1px] bg-black"></div>
    </div>
  );
}
