import { SearchType } from "@/interfaces/EventTypes";
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
  // Commented out the location param and related as search by location is broken, ask Edwin to fix later, just delete duplicate code underneath commments
  const { searchExpanded, setSearchExpanded } = props;
  const [searchParameter, setSearchParameter] = useState("");
  // const [location, setLocation] = useState("Sydney");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchTypeSelected, setSearchTypeSelected] = useState<SearchType>(SearchType.EVENT);

  useEffect(() => {
    // Function to update state based on URL query parameters
    const updateStateFromQuery = () => {
      if (typeof window === "undefined") {
        // Return some default or empty values when not in a browser environment
        setSearchParameter("");
        // setLocation("");
        return;
      }
      const searchParams = new URLSearchParams(window.location.search);

      const userParam = searchParams.get("user");
      const eventParam = searchParams.get("event");
      // const locationParam = searchParams.get("location");

      if (userParam !== null) {
        setSearchParameter(userParam);
        setSearchTypeSelected(SearchType.USER);
      } else if (eventParam !== null) {
        setSearchParameter(eventParam);
        setSearchTypeSelected(SearchType.EVENT);
      }
      // setLocation(locationParam || "");
    };
    updateStateFromQuery();
  }, [pathname, searchParams]);

  const handleSearch = () => {
    const maybePrevSearches = sessionStorage.getItem("recentSearches");
    let prevSearches = maybePrevSearches ? deserialize_list(maybePrevSearches) : [];

    // Store search with type prefix for recent searches
    const currentSearch = `${searchTypeSelected}:${searchParameter}`;

    prevSearches = [currentSearch, ...prevSearches.slice(0, 4)];
    sessionStorage.setItem("recentSearches", serialize_list(prevSearches));
    setRecentSearches(prevSearches);

    // Build search URL based on search type
    let searchUrl = `/?event=${encodeURIComponent(searchParameter)}`;
    if (searchTypeSelected === SearchType.USER) {
      searchUrl = `/?user=${encodeURIComponent(searchParameter)}`;
    }
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
          <button type="button" className="h-8 w-8" onClick={setSearchExpanded} aria-label="Close search">
            <ChevronDownIcon />
          </button>
        </div>
        <div className="w-full mt-6">
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              className={`px-4 py-1 rounded-full text-sm transition-all ${
                searchTypeSelected === SearchType.EVENT ? "bg-black text-white" : "bg-gray-200 text-gray-700"
              }`}
              onClick={() => setSearchTypeSelected(SearchType.EVENT)}
            >
              Events
            </button>
            <button
              type="button"
              className={`px-4 py-1 rounded-full text-sm transition-all ${
                searchTypeSelected === SearchType.USER ? "bg-black text-white" : "bg-gray-200 text-gray-700"
              }`}
              onClick={() => setSearchTypeSelected(SearchType.USER)}
            >
              Users
            </button>
          </div>
        </div>
        <div className="w-full flex items-center mt-4">
          <MagnifyingGlassIcon className="w-7 h-7 mr-2" />
          <input
            id="search_input"
            className="w-56 placeholder:text-2xl text-2xl border-b-2 border-gray-400 outline-none rounded-2xl"
            placeholder={`Search ${searchTypeSelected === SearchType.EVENT ? "Events" : "Users"}`}
            aria-label={`Search for ${searchTypeSelected === SearchType.EVENT ? "events" : "users"}`}
            value={searchParameter}
            onChange={(event) => {
              setSearchParameter(event.target.value);
            }}
            onKeyDown={handleKeyPress}
          />
          <button
            type="button"
            onClick={handleSearch}
            aria-label={`Search ${searchTypeSelected === SearchType.EVENT ? "events" : "users"}`}
          >
            <ArrowRightIcon className="ml-4 w-7 h-7" />
          </button>
        </div>
        <div className="w-full flex items-center mt-7">
          <MapPinIcon className="w-7 h-7 mr-2" />
          {/* <input
            id="location_input"
            className="w-36 placeholder:text-2xl text-2xl border-b-2 border-gray-400 outline-none rounded-2xl"
            placeholder="Sydney"
            value={location}
            onChange={(event) => {
              setLocation(event.target.value);
            }}
            onKeyDown={handleKeyPress}
          /> */}
          <h1 className="text-2xl font-light">Sydney</h1>
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
              <p className="text-sm font-light">None</p>
            ) : (
              recentSearches.map((search, i) => {
                const splitSearch = search.split(":");
                const searchType = splitSearch[0];
                const searchQuery = splitSearch[1] || search; // Fallback for old format

                // Determine if it's a user or event search
                const isUserSearch = searchType === String(SearchType.USER);
                const searchUrl = isUserSearch ? `/?user=${searchQuery}` : `/?event=${searchQuery}`;
                const displayType = isUserSearch ? "User" : "Event";

                return (
                  <span key={i} className="flex items-center my-1">
                    <ClockIcon className="w-4 h-4 mr-1" />
                    <Link href={searchUrl} className="font-light text-base" onClick={setSearchExpanded}>
                      {splitSearch.length > 1 ? `${searchQuery} (${displayType})` : search}
                    </Link>
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
