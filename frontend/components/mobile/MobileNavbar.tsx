"use client";
import { Tag } from "@/interfaces/TagTypes";
import { getAllTags } from "@/services/tagService";
import Image from "next/image";
import { useEffect, useState } from "react";
import ProfilePic from "../navbar/ProfilePic";
import Logo from "./../../public/images/SportsHubMobileLogo.png";
import MobileSearchBar from "./MobileSearchBar";
import MobileSearchInput from "./MobileSearchInput";

export default function MobileNavbar() {
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  useEffect(() => {
    console.log("owen");
    getAllTags().then((tags) => {
      setTags(tags);
    });
  }, []);

  const handleSearchExpanded = () => {
    setSearchExpanded(!searchExpanded);
  };
  return (
    <div className="bg-white drop-shadow-lg fixed top-0 w-screen z-50">
      <div className="flex items-center py-2 px-4">
        <a href="/dashboard">
          <Image
            src={Logo}
            alt="Logo"
            width={50}
            height={50}
            className="w-12 mr-4"
          />
        </a>

        <div className="w-[50%]">
          <MobileSearchBar openSearchInput={handleSearchExpanded} />
          {/* <MobileSearchDialog /> */}
          <MobileSearchInput
            searchExpanded={searchExpanded}
            setSearchExpanded={handleSearchExpanded}
            tags={tags}
          />
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
