"use client";
import { Tag } from "@/interfaces/TagTypes";
import { getAllTags } from "@/services/src/tagService";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ProfilePic from "../navbar/ProfilePic";
import Logo from "./../../public/images/BlackLogo.svg";
import MobileSearchBar from "./MobileSearchBar";
import MobileSearchInput from "./MobileSearchInput";

// Routes where the navbar should be hidden (as regex patterns)
const HIDDEN_NAVBAR_ROUTES = [
  /^\/organiser\/wrapped/, // Organiser wrapped page
  /^\/user\/[^/]+\/wrapped/, // Public wrapped page (/user/*/wrapped)
];

const FULFILMENT_ROUTE_PATTERN = /^\/fulfilment\/([^/]+)\/([^/]+)/;

const shouldHideNavbar = (pathname: string): boolean => {
  // Check route patterns
  if (HIDDEN_NAVBAR_ROUTES.some((pattern) => pattern.test(pathname))) {
    return true;
  }

  // Hide navbar on fulfilment routes when sessionStorage has hideNavbar flag (e.g. from Syrio)
  if (typeof window !== "undefined") {
    const fulfilmentMatch = pathname.match(FULFILMENT_ROUTE_PATTERN);
    if (fulfilmentMatch) {
      const [, fulfilmentSessionId] = fulfilmentMatch;
      const hideNavbarFlag = sessionStorage.getItem(`hideNavbar_${fulfilmentSessionId}`);
      if (hideNavbarFlag === "true") {
        return true;
      }
    }
  }

  return false;
};

export default function MobileNavbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
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

  // When landing with ?hideNavbar=true (from Syrio), store in sessionStorage and strip param.
  // When leaving fulfilment flow, clear all hideNavbar_* keys so future sessions show navbar.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const fulfilmentMatch = pathname.match(FULFILMENT_ROUTE_PATTERN);
    const isOnFulfilmentRoute = Boolean(fulfilmentMatch);

    if (searchParams.get("hideNavbar") === "true" && fulfilmentMatch) {
      const [, fulfilmentSessionId] = fulfilmentMatch;
      sessionStorage.setItem(`hideNavbar_${fulfilmentSessionId}`, "true");

      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete("hideNavbar");
      const newSearch = newSearchParams.toString();
      const newUrl = newSearch ? `${pathname}?${newSearch}` : pathname;
      router.replace(newUrl, { scroll: false });
      return;
    }

    if (!isOnFulfilmentRoute) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith("hideNavbar_")) keysToRemove.push(key);
      }
      keysToRemove.forEach((key) => sessionStorage.removeItem(key));
    }
  }, [pathname, searchParams, router]);

  if (shouldHideNavbar(pathname)) {
    return (
      <div
        className="fixed top-0 left-0 right-0 h-[var(--navbar-height)] z-50 bg-core-hover"
        aria-hidden="true"
      />
    );
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
