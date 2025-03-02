import { SearchIcon } from "@/svgs/SearchIcon";

interface MobileSearchBarProps {
  openSearchInput: () => void;
}

export default function MobileSearchBar(props: MobileSearchBarProps) {
  return (
    <div
      className="flex border border-1 border-core-outline rounded-full h-10 md:h-10 pl-5 pr-0.5 width w-fit items-center bg-white shadow-sm"
      onClick={props.openSearchInput}
    >
      <h2 className="min-w-[120px] text-gray-500">Search events</h2>
      <button className="w-7 h-7 rounded-full border border-black bg-black mr-1">
        <SearchIcon />
      </button>
    </div>
  );
}
