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
    console.log("search");
    const searchUrl = `/dashboard?event=${encodeURIComponent(event)}&location=${encodeURIComponent(location)}`;
    router.push(searchUrl);
  };
  const handleKeyPress = (e: { key: string }) => {
    if (e.key === "Enter") {
      console.log("search");
      const searchUrl = `/dashboard?event=${encodeURIComponent(event)}&location=${encodeURIComponent(location)}`;
      router.push(searchUrl);
    }
  };
  return (
    <div className="flex border border-1 border-black rounded-full h-10 pl-5 pr-0.5 w-fit items-center bg-white drop-shadow-md">
      <input
        // className="h-9 max-w-[160px] xl:max-w-[220px] border-0 focus:ring-0"
        className="h-9 w-64 border-0 focus:ring-0"
        type="text"
        placeholder="Search for events in Sydney, AU"
        value={event}
        onChange={(e) => setEvent(e.target.value)}
        onKeyDown={handleKeyPress}
      />
      {/* <div className="h-full bg-black w-[1px] mx-2"></div> */}
      {/* <input
        className="h-9 max-w-[160px] xl:max-w-[220px] border-0 focus:ring-0"
        type="text"
        placeholder="Sydney, AU"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        onKeyDown={handleKeyPress}
      /> */}
      <button onClick={handleSearchClick} className="w-9 h-9 rounded-full border border-black bg-black">
        <SearchIcon />
      </button>
    </div>
  );
}
