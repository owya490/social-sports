import { SearchIcon } from "@/svgs/SearchIcon";

interface MobileSearchBarProps {
  openSearchInput: () => void;
}

export default function MobileSearchBar(props: MobileSearchBarProps) {
  return (
    <div
      className="flex border border-1 border-core-outline rounded-full h-10 pl-5 pr-0.5 items-center bg-white shadow-sm w-full max-w-full min-w-0 cursor-pointer"
      onClick={props.openSearchInput}
    >
      <h2 className="flex-1 text-gray-500 text-sm truncate">Search events</h2>
      <button className="w-7 h-7 rounded-full border border-black bg-black mr-1 flex-shrink-0">
        <SearchIcon />
      </button>
    </div>
  );
}
