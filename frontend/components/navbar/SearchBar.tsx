import { SearchIcon } from "@/svgs/SearchIcon";

export default function SearchBar() {
  return (
    <div className="flex border border-1 border-black rounded-full h-10 md:h-10 pl-5 pr-0.5 width w-fit items-center bg-white drop-shadow-md">
      <input
        className="h-9 max-w-[100px] sm:max-w-[160px] xl:max-w-[220px]"
        type="text"
        placeholder="Search Event"
        style={{
          outline: "none",
        }}
      ></input>
      <div className="h-full bg-black w-[1px] mx-2"></div>
      <input
        className="h-9 max-w-[60px] sm:max-w-[160px] xl:max-w-[220px]"
        type="text"
        placeholder="Sydney, AU"
        style={{
          outline: "none",
        }}
      ></input>
      <button className="w-9 h-9 rounded-full border border-black bg-black">
        <SearchIcon />
      </button>
    </div>
  );
}
