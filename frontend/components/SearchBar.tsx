import { SearchIcon } from "@/svgs/SearchIcon";

export default function SearchBar() {
    return (
        <div className="flex border border-1 border-black rounded-full width h-10 pl-5 pr-0.5 w-fit items-center bg-white drop-shadow-md">
            <input
                className="h-9"
                type="text"
                placeholder="Search Event"
                style={{
                    outline: "none",
                }}
            ></input>
            <div className="h-full bg-black w-[1px] mx-2"></div>
            <input
                className="h-9"
                type="text"
                placeholder="Sydney, AU"
                style={{
                    outline: "none",
                }}
            ></input>
            <button className="w-9 h-9 rounded-full border border-black bg-[#30ADFF]">
                <SearchIcon />
            </button>
        </div>
    );
}
