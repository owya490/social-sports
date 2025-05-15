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
    getAllTags().then((tags) => {
      setTags(tags);
    });
  }, []);
  const handleSearchExpanded = () => {
    setSearchExpanded(!searchExpanded);
  };
  return (
    <div className="bg-white fixed top-0 w-screen z-50 h-[3.75rem] border-b border-core-outline">
      <div className="flex items-center py-2 px-4 h-full">
        <Link href="/dashboard">
          <Image src={Logo} alt="Logo" className="w-10 h-10 mr-4" />
        </Link>

        <div className="w-[50%]">
          <MobileSearchBar openSearchInput={handleSearchExpanded} />
          <MobileSearchInput searchExpanded={searchExpanded} setSearchExpanded={handleSearchExpanded} tags={tags} />
        </div>
        <ProfilePic />
      </div>
    </div>
  );
}
