import { ArrowRightIcon, ChevronDownIcon, MagnifyingGlassIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { Tag } from "@/interfaces/TagTypes";
import { deserialize_list, serialize_list } from "../../utilities/listUtils";
import Link from "next/link";

interface MobileSearchInputProps {
  setSearchExpanded: () => void;
  tags: Tag[];
}

export default function MobileSearchInput(props: MobileSearchInputProps) {
  const { setSearchExpanded, tags } = props;
  const [searchPhrase, setSearchPhrase] = useState("");
  const [searchLocation, setSearchLocation] = useState("Sydney");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    const maybeRecentSearch = sessionStorage.getItem("recentSearches");
    if (maybeRecentSearch) {
      setRecentSearches(deserialize_list(maybeRecentSearch));
    }
  }, []);

  const handleSearchSubmit = () => {
    const currentSearch = searchPhrase + ":" + searchLocation;
    const maybePrevSearches = sessionStorage.getItem("recentSearches");
    let prevSearches: string[] = [];

    if (maybePrevSearches) {
      prevSearches = deserialize_list(maybePrevSearches);
    }

    prevSearches.unshift(currentSearch);
    sessionStorage.setItem("recentSearches", serialize_list(prevSearches));
    setRecentSearches(prevSearches);

    setSearchExpanded();
  };

  return (
    <div className="p-6">
      <div className="w-full flex justify-center">
        <button className="h-8 w-8" onClick={setSearchExpanded}>
          <ChevronDownIcon />
        </button>
      </div>

      <div className="w-full flex items-center mt-8">
        <MagnifyingGlassIcon className="w-7 h-7 mr-2" />
        <input
          id="search_input"
          className="w-56 placeholder:text-2xl text-2xl border-b-2 border-gray-400 outline-none"
          placeholder="Search Events"
          value={searchPhrase}
          onChange={(event) => setSearchPhrase(event.target.value)}
        />
        <button onClick={handleSearchSubmit}>
          <ArrowRightIcon className="ml-4 w-7 h-7" />
        </button>
      </div>

      <div className="w-full flex items-center mt-7">
        <MapPinIcon className="w-7 h-7 mr-2" />
        <input
          id="location_input"
          className="w-36 placeholder:text-2xl text-2xl border-b-2 border-gray-400 outline-none"
          placeholder="Location"
          value={searchLocation}
          onChange={(event) => setSearchLocation(event.target.value)}
        />
      </div>

      <div className="w-full mt-14 ml-1">
        <h3 className="font-semibold text-lg">Search by Tags</h3>
        <div className="flex flex-wrap mt-1 max-h-36 overflow-y-scroll">
          {/* Assuming TagGroup is correctly rendering tags */}
        </div>
      </div>

      <div className="w-full mt-10 ml-1">
        <h3 className="font-semibold text-lg">Recent Searches</h3>
        <div className="h-36 overflow-y-scroll">
          {recentSearches.length === 0 ? (
            <p className="text-sm font-light">No recent searches... go ahead ;)</p>
          ) : (
            recentSearches.map((search, i) => {
              const [term, location] = search.split(":");
              return (
                <span key={i} className="flex items-center my-1">
                  <Link href={`/${term}-${location}`} className="font-light text-base">
                    {`${term} - ${location}`}
                  </Link>
                </span>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
