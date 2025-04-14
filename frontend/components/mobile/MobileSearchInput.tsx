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
  const [event, setEvent] = useState("");
  // const [location, setLocation] = useState("Sydney");
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
        // setLocation("");
        return;
      }
      const searchParams = new URLSearchParams(window.location.search);

      const eventParam = searchParams.get("event");
      // const locationParam = searchParams.get("location");

      setEvent(eventParam || "");
      // setLocation(locationParam || "");
    };
    updateStateFromQuery();
  }, [pathname, searchParams]);

  const handleSearch = () => {
    const maybePrevSearches = sessionStorage.getItem("recentSearches");
    let prevSearches = maybePrevSearches ? deserialize_list(maybePrevSearches) : [];

    // const currentSearch = event + ":" + location;
    const currentSearch = event;

    prevSearches = [currentSearch, ...prevSearches.slice(0, 4)];
    sessionStorage.setItem("recentSearches", serialize_list(prevSearches));
    setRecentSearches(prevSearches);

    // const searchUrl = `/dashboard?event=${encodeURIComponent(event)}&location=${encodeURIComponent(location)}`;
    const searchUrl = `/dashboard?event=${encodeURIComponent(event)}`;
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
          <button className="h-8 w-8" onClick={setSearchExpanded}>
            <ChevronDownIcon />
          </button>
        </div>
        <div className="w-full flex items-center mt-8">
          <MagnifyingGlassIcon className="w-7 h-7 mr-2" />
          <input
            id="search_input"
            className="w-56 placeholder:text-2xl text-2xl border-b-2 border-gray-400 outline-none rounded-2xl"
            placeholder="Search Events"
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
              // recentSearches.map((search, i) => {
              //   const splitSearch = search.split(":");
              //   const recentEvent = splitSearch[0];
              //   const recentLocation = splitSearch[1];
              //   return (
              //     <span key={i} className="flex items-center my-1">
              //       <ClockIcon className="w-4 h-4 mr-1" />
              //       <Link
              //         href={`/dashboard?event=${recentEvent}&location=${recentLocation}`}
              //         className="font-light text-base"
              //         onClick={setSearchExpanded}
              //       >{`${recentEvent} - ${recentLocation}`}</Link>
              //     </span>
              //   );
              // })
              recentSearches.map((search, i) => {
                return (
                  <span key={i} className="flex items-center my-1">
                    <ClockIcon className="w-4 h-4 mr-1" />
                    <Link
                      href={`/dashboard?event=${search}`}
                      className="font-light text-base"
                      onClick={setSearchExpanded}
                    >{`${search} - Sydney`}</Link>
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
