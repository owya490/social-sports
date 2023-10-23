"use client";

import Image from "next/image";
import DP from "./../public/images/Ashley & Owen.png";
import Logo from "./../public/images/Logo.png";
import SearchBar from "./SearchBar";
import React, { useState } from 'react';

// import { Roboto_Condensed } from "next/font/google";

// const roboto_condensed = Roboto_Condensed({
//     weight: "300",
//     subsets: ["latin"],
//     display: "swap",
//     variable: "--font-roboto-condensed",
// });

export default function Navbar() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
    };

    return (
        <div className="bg-white drop-shadow-lg fixed top-0 w-screen z-50">
            <div className="flex items-center py-2 px-10">
                <Image
                    src={Logo}
                    alt="Logo"
                    width={50}
                    height={50}
                    className="w-12 mx-1"
                />
                <h1 className="font-robotocondensed text-3xl font-extrabold mr-20">
                    SOCIAL SPORTS
                </h1>

                <SearchBar />
                <div className="flex ml-auto items-center">
                    <button
                        className=" border border-black px-3 py-2 rounded-full mx-5"
                        onChange={(e) => {
                            window.open("https://www.google.com", "_self");
                        }}
                    >
                        Create Event
                    </button>
                    <button id="dropdownDividerButton" onClick={toggleDropdown} className=" border border-black rounded-full w-10 h-10">
                        <Image
                            src={DP}
                            alt="DP"
                            width={50}
                            height={50}
                            className="rounded-full w-10 h-10"
                        />
                    </button>
                    {isDropdownOpen && 
                    <div id="dropdownDivider" className="z-10 bg-white divide-y divide-gray-100 rounded-lg shadow w-44 dark:bg-gray-700">
                        <ul className="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownDefaultButton">
                        <li>
                            <a href="#" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Dashboard</a>
                        </li>
                        <li>
                            <a href="#" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Settings</a>
                        </li>
                        <li>
                            <a href="#" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Earnings</a>
                        </li>
                        <li>
                            <a href="#" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Sign out</a>
                        </li>
                        </ul>
                    </div>
                    }
                </div>

                {/* <div className="rounded-full w-10 h-10 bg-red-200 ml-auto"></div> */}
            </div>
            <div className="h-[1px] bg-black"></div>
        </div>
    );
}
