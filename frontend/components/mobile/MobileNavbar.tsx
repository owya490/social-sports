"use client";
import { Tag } from "@/interfaces/TagTypes";
import { getAllTags } from "@/services/src/tagService";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import ProfilePic from "../navbar/ProfilePic";
import Logo from "./../../public/images/BlackLogo.svg";
import MobileSearchBar from "./MobileSearchBar";
import MobileSearchInput from "./MobileSearchInput";

export default function MobileNavbar() {
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  useEffect(() => {
    getAllTags()
      .then((tags) => {
        setTags(tags);
      })
      .catch((error) => {
        console.error("Failed to fetch tags:", error);
        setTags([]); // Set empty array as fallback
      });
  }, []);
  const handleSearchExpanded = () => {
    setSearchExpanded(!searchExpanded);
  };
  return (
    <header className="bg-white fixed top-0 w-full z-50">
      <nav
        className="flex items-center justify-between h-14 px-4 max-w-full"
        role="navigation"
        aria-label="Mobile navigation"
      >
        <Link href="/" aria-label="Go to dashboard" className="flex-shrink-0">
          <Image src={Logo} alt="SPORTSHUB - Find and book social sports events" className="w-10 h-10" />
        </Link>

        <div className="flex-1 min-w-0 mx-4">
          <MobileSearchBar openSearchInput={handleSearchExpanded} />
          <MobileSearchInput searchExpanded={searchExpanded} setSearchExpanded={handleSearchExpanded} tags={tags} />
        </div>
        <div className="flex-shrink-0">
          <ProfilePic />
        </div>
      </nav>
      <div className="h-[1px] bg-core-outline"></div>
    </header>
  );
}
