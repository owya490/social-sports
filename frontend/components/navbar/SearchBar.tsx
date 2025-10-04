"use client";

import { SearchIcon } from "@/svgs/SearchIcon";
import { Select } from "@headlessui/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function SearchBar() {
  const [searchParameter, setSearchParameter] = useState("");
  const [location, setLocation] = useState("");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Function to update state based on URL query parameters
    const updateStateFromQuery = () => {
      if (typeof window === "undefined") {
        // Return some default or empty values when not in a browser environment
        setSearchParameter("");
        setLocation("");
      }
      const searchParams = new URLSearchParams(window.location.search);
      const user = searchParams.get("user");
      const event = searchParams.get("event");
      const location = searchParams.get("location");
      if (user) {
        setSearchParameter(user);
        setSearchTypeSelected("users");
      }
      if (event) {
        setSearchParameter(event);
      }
      if (location) {
        setLocation(location);
      }
    };
    updateStateFromQuery();
  }, [pathname, searchParams]);

  const handleSearchClick = () => {
    // Default to events
    var searchUrl = `/?event=${encodeURIComponent(searchParameter)}&location=${encodeURIComponent(location)}`;
    if (searchTypeSelected == "users") {
      searchUrl = `/?user=${encodeURIComponent(searchParameter)}`;
    }
    router.push(searchUrl);
  };
  const handleKeyPress = (e: { key: string }) => {
    if (e.key === "Enter") {
      var searchUrl = `/?event=${encodeURIComponent(searchParameter)}&location=${encodeURIComponent(
        location
      )}`;
      if (searchTypeSelected == "users") {
        searchUrl = `/?user=${encodeURIComponent(searchParameter)}`;
      }
      router.push(searchUrl);
    }
  };

  const [searchTypeSelected, setSearchTypeSelected] = useState("events");

  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const groupRef = useRef(null);
  const selectRef = useRef(null);

  const [selectTargetWidth, setSelectTargetWidth] = useState(0);

  useEffect(() => {
    if (selectRef.current && isFocused) {
      // @ts-ignore
      const width = selectRef.current.getBoundingClientRect().width;
      setSelectTargetWidth(width);
    } else if (!isFocused) {
      setSelectTargetWidth(0);
    }
  }, [isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = (e: any) => {
    // Check if the newly focused element is still inside the group
    // @ts-ignore
    if (groupRef.current && !groupRef.current.contains(e.relatedTarget)) {
      setIsFocused(false);
    }
  };

  return (
    <div
      className={`flex border border-1 border-core-outline rounded-full h-10 pl-5 pr-1 w-fit items-center shadow-sm group transition-all duration-[400ms] ease-in-out ${
        isFocused ? "" : `${isHovered ? "bg-core-hover" : ""}`
      }`}
      ref={groupRef}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseLeave={() => {
        setIsHovered(false);
      }}
      onMouseEnter={() => {
        setIsHovered(true);
      }}
    >
      <input
        // className={`h-9 w-64 border-0 focus:ring-0 font-thin ${isFocused ? "" : `${isHovered ? "bg-core-hover" : ""}`}`}
        className={`h-9 w-64 border-0 focus:ring-0 font-thin bg-transparent`}
        type="text"
        placeholder={`Search for ${searchTypeSelected.charAt(0).toUpperCase() + searchTypeSelected.slice(1)}`}
        value={searchParameter}
        onChange={(e) => setSearchParameter(e.target.value)}
        onKeyDown={handleKeyPress}
        onMouseEnter={() => setIsHovered(true)}
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
      <div
        className={`overflow-hidden transition-all duration-[400ms] mr-1 `}
        style={{ width: `${selectTargetWidth}px` }}
      >
        <Select
          ref={selectRef}
          className={`rounded-full font-thin border-0 py-1 px-1 pl-3 w-[5.65rem] hover:bg-core-hover focus:ring-0`}
          onChange={(e) => {
            setSearchTypeSelected(e.target.value);
          }}
          value={searchTypeSelected}
        >
          <option value="events">Events</option>
          <option value="users">Users</option>
        </Select>
      </div>
      <button
        onClick={handleSearchClick}
        className={`w-fit rounded-full border border-black bg-black transition-all duration-[400ms] text-white flex ${
          isFocused ? "h-8" : "h-7"
        }`}
      >
        <div className={`font-thin text-white overflow-hidden transition-all ${isFocused ? "w-16" : "w-0"}`}>
          <p className="pt-[2.5px] pl-2">Search</p>
        </div>
        <SearchIcon />
      </button>
    </div>
  );
}
