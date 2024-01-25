"use client";

import { useRouter } from "next/navigation";
import { usePathname, useSearchParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import { SearchIcon } from "@/svgs/SearchIcon";
import { searchEventsByKeyword } from "@/services/eventsService";

export default function SearchBar() {
  const [event, setEvent] = useState("");
  const [location, setLocation] = useState("");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // PLEASE DON"T CHANGE THIS FUNCTION, RIGHT NOW THIS EVENT TRIGGERS ON EVERY INSTANCE BECAUSE I CAN'T FIGURE OUT HOW TO LISTEN FOR URL CHANGES ONLY
  useEffect(() => {
    // Function to update state based on URL query parameters
    console.log("PAGECHANGE");
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
  //   ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  const handleSearchClick = () => {
    console.log("search");
    const searchUrl = `/dashboard?event=${encodeURIComponent(
      event
    )}&location=${encodeURIComponent(location)}`;
    router.push(searchUrl);
  };
  return (
    <div className="flex border border-1 border-black rounded-full h-10 pl-5 pr-0.5 w-fit items-center bg-white drop-shadow-md">
      <input
        className="h-9 max-w-[160px] xl:max-w-[220px]"
        type="text"
        placeholder="Search Event"
        style={{ outline: "none" }}
        value={event}
        onChange={(e) => setEvent(e.target.value)}
      />
      <div className="h-full bg-black w-[1px] mx-2"></div>
      <input
        className="h-9 max-w-[160px] xl:max-w-[220px]"
        type="text"
        placeholder="Sydney, AU"
        style={{ outline: "none" }}
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />
      <button
        onClick={handleSearchClick}
        className="w-9 h-9 rounded-full border border-black bg-[#30ADFF]"
      >
        <SearchIcon />
      </button>
    </div>
  );
}
