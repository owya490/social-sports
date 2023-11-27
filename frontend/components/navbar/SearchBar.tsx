import React, { useState } from "react";
import { SearchIcon } from "@/svgs/SearchIcon";
import { searchEventsByKeyword } from "@/services/eventsService";
// import { useNavigate } from "react-router-dom";

export default function SearchBar() {
    const [event, setEvent] = useState("");
    const [location, setLocation] = useState("");
    // const navigate = useNavigate();
    const searchUrl = `/dashboard?event=${encodeURIComponent(
        event
    )}&location=${encodeURIComponent(location)}`;

    return (
        <div className="flex border border-1 border-black rounded-full h-10 pl-5 pr-0.5 width w-fit items-center bg-white drop-shadow-md">
            <input
                className="h-9 max-w-[160px] xl:max-w-[220px]"
                type="text"
                placeholder="Search Event"
                style={{ outline: "none" }}
                value={event}
                onChange={(e) => setEvent(e.target.value)}
            ></input>
            <div className="h-full bg-black w-[1px] mx-2"></div>
            <input
                className="h-9 max-w-[160px] xl:max-w-[220px]"
                type="text"
                placeholder="Sydney, AU"
                style={{ outline: "none" }}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
            ></input>
            <a
                href={searchUrl}
                className="w-9 h-9 rounded-full border border-black bg-[#30ADFF]"
            >
                <SearchIcon />
            </a>
        </div>
    );
}
