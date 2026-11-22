"use client";
import { Tag } from "@/interfaces/TagTypes";
import { getAllTags } from "@/services/src/tagService";
import { useEffect, useState } from "react";
import Logo from "../navbar/Logo";
import { SportshubHomeLink } from "../navbar/SportshubHomeLink";
import ProfilePic from "../navbar/ProfilePic";
import { useNavbarVariant } from "@components/navbar/navbarVisibility";
import MobileSearchBar from "./MobileSearchBar";
import MobileSearchInput from "./MobileSearchInput";

export default function MobileNavbar() {
  const variant = useNavbarVariant();
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    if (variant !== "full") return;

    let cancelled = false;
    getAllTags()
      .then((tags) => {
        if (!cancelled) setTags(tags);
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Failed to fetch tags:", error);
          setTags([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [variant]);

  if (variant === "hidden") {
    return null;
  }

  const handleSearchExpanded = () => {
    setSearchExpanded(!searchExpanded);
  };

  return (
    <header className="bg-white fixed top-0 w-full z-50">
      <nav
        className="flex items-center justify-between h-[var(--navbar-height)] px-4 max-w-full"
        role="navigation"
        aria-label="Mobile navigation"
      >
        {variant === "brandOnly" ? (
          <Logo linkToHome={false} />
        ) : (
          <>
            <SportshubHomeLink imageClassName="h-10 w-10" />

            <div className="flex-1 min-w-0 mx-4">
              <MobileSearchBar openSearchInput={handleSearchExpanded} />
              <MobileSearchInput
                searchExpanded={searchExpanded}
                setSearchExpanded={handleSearchExpanded}
                tags={tags}
              />
            </div>
            <div className="flex-shrink-0">
              <ProfilePic />
            </div>
          </>
        )}
      </nav>
      <div className="h-[1px] bg-core-outline"></div>
    </header>
  );
}
