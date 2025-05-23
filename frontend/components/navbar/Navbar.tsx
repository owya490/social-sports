"use client";

import Logo from "./Logo";
import ProfilePic from "./ProfilePic";
import SearchBar from "./SearchBar";

export default function Navbar() {
  return (
    <div className="bg-white fixed top-0 w-screen z-50">
      <div className="flex items-center py-2 px-5 lg:px-8 xl:px-12">
        <div className="mr-12">
          <Logo />
        </div>
        <SearchBar />
        <ProfilePic />
      </div>

      <div className="h-[1px] bg-core-outline"></div>
    </div>
  );
}
