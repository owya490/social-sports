import { Tag } from "@/interfaces/TagTypes";
import {
  ArrowRightIcon,
  ChevronDownIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { deserialize_list, serialize_list } from "../../utilities/listUtils";

interface MobileSearchInputProps {
  searchExpanded: boolean;
  setSearchExpanded: () => void;
  tags: Tag[];
}

export default function MobileSearchInput(props: MobileSearchInputProps) {
  const { searchExpanded, setSearchExpanded, tags } = props;
  const [event, setEvent] = useState("");
  const [location, setLocation] = useState("Sydney");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
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

  const handleSearch = () => {
    const maybePrevSearches = sessionStorage.getItem("recentSearches");
    const currentSearch = event + ":" + location;
    console.log("CURRENT" + currentSearch);
    if (maybePrevSearches) {
      const prevSearches: string[] = deserialize_list(maybePrevSearches);
      prevSearches.unshift(currentSearch);
      sessionStorage.setItem("recentSearches", serialize_list(prevSearches));
      setRecentSearches(prevSearches);
    } else {
      sessionStorage.setItem("recentSearches", serialize_list([currentSearch]));
      setRecentSearches([currentSearch]);
    }
    console.log("mobile search");
    const searchUrl = `/dashboard?event=${encodeURIComponent(event)}&location=${encodeURIComponent(location)}`;
    router.push(searchUrl);
    setSearchExpanded();
  };

  const handleKeyPress = (e: { key: string }) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  useEffect(() => {
    const maybeRecentSearch = sessionStorage.getItem("recentSearches");
    if (maybeRecentSearch) {
      setRecentSearches(deserialize_list(maybeRecentSearch));
    }
  }, []);

  useEffect(() => {
    console.log(recentSearches);
  }, [recentSearches]);

  return (
    <div
      className={
        searchExpanded
          ? `h-screen bg-white w-screen absolute top-[0px] left-0 z-50 transition-all duration-500`
          : `h-screen bg-white w-screen absolute top-[2000px] left-0 z-50 transition-all duration-500`
      }
    >
      <div
        className={
          searchExpanded ? `p-6 opacity-100 transition-all delay-500 duration-500` : `p-6 opacity-0 transition-all`
        }
      >
        <div className="w-full flex justify-center">
          <button className="h-8 w-8" onClick={setSearchExpanded}>
            <ChevronDownIcon />
          </button>
        </div>
        <div className="w-full flex items-center mt-8">
          <MagnifyingGlassIcon className="w-7 h-7 mr-2" />
          <input
            id="search_input"
            className="w-56 placeholder:text-2xl text-2xl border-b-2 border-gray-400 outline-none rounded-2xl"
            placeholder="Search Event"
            value={event}
            onChange={(event) => {
              setEvent(event.target.value);
            }}
            onKeyDown={handleKeyPress}
          />
          <button onClick={handleSearch}>
            <ArrowRightIcon className="ml-4 w-7 h-7" />
          </button>
        </div>
        <div className="w-full flex items-center mt-7">
          <MapPinIcon className="w-7 h-7 mr-2" />
          <input
            id="location_input"
            className="w-36 placeholder:text-2xl text-2xl border-b-2 border-gray-400 outline-none rounded-2xl"
            placeholder="Location"
            value={location}
            onChange={(event) => {
              setLocation(event.target.value);
            }}
            onKeyDown={handleKeyPress}
          />
        </div>
        {/* <div className="w-full mt-14 ml-1">
          <h3 className="font-semibold text-lg">Search by Tags</h3>
          <div className="flex flex-wrap mt-1 max-h-36 overflow-y-scroll">
            <TagGroup tags={tags} size="sm" />
          </div>
        </div> */}
        <div className="w-full mt-10 ml-1">
          <h3 className="font-semibold text-lg">Recent Searches</h3>
          <div className="h-44 overflow-y-scroll">
            {recentSearches.length === 0 ? (
              <p className="text-sm font-light">No recent searches... go ahead ;)</p>
            ) : (
              recentSearches.map((search, i) => {
                const splitSearch = search.split(":");
                const recentEvent = splitSearch[0];
                const recentSearch = splitSearch[1];
                return (
                  <span key={i} className="flex items-center my-1">
                    <ClockIcon className="w-4 h-4 mr-1" />
                    <Link
                      href={`/dashboard?event=${recentEvent}&location=${recentSearch}`}
                      className="font-light text-base"
                      onClick={setSearchExpanded}
                    >{`${recentEvent} - ${recentSearch}`}</Link>
                  </span>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
