import { Tag } from "@/interfaces/TagTypes";
import {
  ArrowRightIcon,
  ChevronDownIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { TagGroup } from "../TagGroup";
import { deserialize_list, serialize_list } from "../utility/listUtils";

interface IMobileSearchInput {
  searchExpanded: boolean;
  setSearchExpanded: () => void;
  tags: Tag[];
}

export default function MobileSearchInput(props: IMobileSearchInput) {
  const { searchExpanded, setSearchExpanded, tags } = props;
  const [searchPhrase, setSearchPhrase] = useState("");
  const [searchLocation, setSearchLocation] = useState("Sydney");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    const maybeRecentSearch = sessionStorage.getItem("recentSearches");
    if (maybeRecentSearch) {
      console.log(maybeRecentSearch);
      console.log(["owen", "yang"].toString());
      console.log(Array.from(["owen", "yang"].toString().split(",")));
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
          searchExpanded
            ? `p-6 opacity-100 transition-all delay-500 duration-500`
            : `p-6 opacity-0 transition-all`
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
            className="w-56 placeholder:text-2xl text-2xl border-b-2 border-gray-400 outline-none"
            placeholder="Search Events"
            value={searchPhrase}
            onChange={(event) => {
              setSearchPhrase(event.target.value);
            }}
          />
          <button
            onClick={() => {
              const maybePrevSearches =
                sessionStorage.getItem("recentSearches");
              const currentSearch = searchPhrase + ":" + searchLocation;
              console.log(currentSearch);
              if (maybePrevSearches) {
                const prevSearches: string[] =
                  deserialize_list(maybePrevSearches);
                prevSearches.unshift(currentSearch);
                sessionStorage.setItem(
                  "recentSearches",
                  serialize_list(prevSearches)
                );
                setRecentSearches(prevSearches);
              } else {
                sessionStorage.setItem(
                  "recentSearches",
                  serialize_list([currentSearch])
                );
                setRecentSearches([currentSearch]);
              }
              setSearchExpanded();
            }}
          >
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
            onChange={(event) => {
              setSearchLocation(event.target.value);
            }}
          />
        </div>
        <div className="w-full mt-14 ml-1">
          <h3 className="font-semibold text-lg">Search by Tags</h3>
          <div className="flex flex-wrap mt-1 max-h-36 overflow-y-scroll">
            <TagGroup tags={tags} size="sm" />
          </div>
        </div>
        <div className="w-full mt-10 ml-1">
          <h3 className="font-semibold text-lg">Recent Searches</h3>
          <div className="h-36 overflow-y-scroll">
            {recentSearches.length === 0 ? (
              <p className="text-sm font-light">
                No recent searches... go ahead ;)
              </p>
            ) : (
              recentSearches.map((search) => {
                console.log(search);
                const splitSearch = search.split(":");
                return (
                  <span className="flex items-center my-1">
                    <ClockIcon className="w-4 h-4 mr-1" />
                    <a
                      href="https://google.com"
                      className="font-light text-base"
                    >{`${splitSearch[0]} - ${splitSearch[1]}`}</a>
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
