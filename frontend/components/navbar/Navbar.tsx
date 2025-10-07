"use client";

import Logo from "./Logo";
import ProfilePic from "./ProfilePic";
import SearchBar from "./SearchBar";

export default function Navbar() {
  return (
    <header className="bg-white fixed top-0 w-full z-50 box-border border-b-[1px] border-core-outline h-[var(--navbar-height)]">
      <nav
        className="flex items-center justify-between h-full px-5 lg:px-8 xl:px-12 max-w-full"
        aria-label="Main navigation"
      >
        <div className="flex items-center min-w-0">
          <div className="mr-6 lg:mr-12 flex-shrink-0">
            <Logo />
          </div>
          <div className="min-w-0 flex-shrink">
            <SearchBar />
          </div>
        </div>
        <div className="flex-shrink-0">
          <ProfilePic />
        </div>
      </nav>
    </header>
  );
}
