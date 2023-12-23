import { SearchIcon } from "@/svgs/SearchIcon";

interface MobileSearchBarProps {
  // openModal: () => void;
  openSearchInput: () => void;
}

export default function MobileSearchBar(props: MobileSearchBarProps) {
  return (
    <div
      className="flex border border-1 border-black rounded-full h-10 md:h-10 pl-5 pr-0.5 width w-fit items-center bg-white drop-shadow-md"
      onClick={props.openSearchInput}
    >
      <h2 className="min-w-[120px] text-gray-500">Search Events</h2>
      <button className="w-9 h-9 rounded-full border border-black bg-black">
        <SearchIcon />
      </button>
    </div>
  );
}
