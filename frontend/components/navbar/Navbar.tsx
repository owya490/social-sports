"use client";

import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import Logo from "./Logo";
import ProfilePic from "./ProfilePic";
import SearchBar from "./SearchBar";

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

export default function Navbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  // When landing with ?hideNavbar=true (from Syrio), store in sessionStorage and strip param.
  // When leaving fulfilment flow, clear all hideNavbar_* keys so future sessions show navbar.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const fulfilmentMatch = pathname.match(FULFILMENT_ROUTE_PATTERN);
    const isOnFulfilmentRoute = Boolean(fulfilmentMatch);

    if (searchParams.get("hideNavbar") === "true" && fulfilmentMatch) {
      const [, fulfilmentSessionId] = fulfilmentMatch;
      sessionStorage.setItem(`hideNavbar_${fulfilmentSessionId}`, "true");

      // Strip ?hideNavbar=true from URL; navbar stays hidden via sessionStorage
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
