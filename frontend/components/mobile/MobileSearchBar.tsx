import { SearchIcon } from "@/svgs/SearchIcon";

interface MobileSearchBarProps {
  openSearchInput: () => void;
}

export default function MobileSearchBar(props: MobileSearchBarProps) {
  return (
    <button
      type="button"
      onClick={props.openSearchInput}
      aria-label="Open search"
      className="flex border border-1 border-core-outline rounded-full h-10 pl-5 pr-0.5 items-center bg-white shadow-sm w-full max-w-full min-w-0 cursor-pointer"
    >
      <span className="flex-1 text-gray-500 text-sm truncate text-left">Search events</span>
      <span className="w-7 h-7 rounded-full border border-black bg-black mr-1 flex-shrink-0 flex items-center justify-center">
        <SearchIcon />
      </span>
    </button>
  );
}
