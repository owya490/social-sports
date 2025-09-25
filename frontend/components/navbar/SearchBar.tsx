"use client";

import { SearchIcon } from "@/svgs/SearchIcon";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function SearchBar() {
  const [event, setEvent] = useState("");
  const [location, setLocation] = useState("");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Function to update state based on URL query parameters
    const updateStateFromQuery = () => {
      if (typeof window === "undefined") {
        // Return some default or empty values when not in a browser environment
        setEvent("");
        setLocation("");
      }
      const searchParams = new URLSearchParams(window.location.search);
      const event = searchParams.get("event");
      const location = searchParams.get("location");

      if (event) {
        setEvent(event);
      }
      if (location) {
        setLocation(location);
      }
    };
    updateStateFromQuery();
  }, [pathname, searchParams]);

  const handleSearchClick = () => {
    const searchUrl = `/dashboard?event=${encodeURIComponent(event)}&location=${encodeURIComponent(location)}`;
    router.push(searchUrl);
  };
  const handleKeyPress = (e: { key: string }) => {
    if (e.key === "Enter") {
      const searchUrl = `/dashboard?event=${encodeURIComponent(event)}&location=${encodeURIComponent(location)}`;
      router.push(searchUrl);
    }
  };
  return (
    <div className="flex border border-1 border-core-outline rounded-full h-10 pl-5 pr-1 items-center bg-white shadow-sm min-w-0 max-w-full">
      <input
        className="h-9 w-full min-w-0 max-w-[200px] md:max-w-[250px] lg:max-w-[300px] border-0 focus:ring-0"
        type="text"
        placeholder="Search for events"
        aria-label="Search for sports events"
        value={event}
        onChange={(e) => setEvent(e.target.value)}
        onKeyDown={handleKeyPress}
      />
      <button
        onClick={handleSearchClick}
        className="w-7 h-7 rounded-full border border-black bg-black flex-shrink-0"
        aria-label="Search events"
      >
        <SearchIcon />
      </button>
    </div>
  );
}
