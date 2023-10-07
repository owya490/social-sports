import Image from "next/image";
import DP from "./../public/images/Ashley & Owen.png";
import Logo from "./../public/images/Logo.png";
import SearchBar from "./SearchBar";

// import { Roboto_Condensed } from "next/font/google";

// const roboto_condensed = Roboto_Condensed({
//     weight: "300",
//     subsets: ["latin"],
//     display: "swap",
//     variable: "--font-roboto-condensed",
// });

export default function Navbar() {
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
                    <button className=" border border-black rounded-full w-10 h-10">
                        <Image
                            src={DP}
                            alt="DP"
                            width={50}
                            height={50}
                            className="rounded-full w-10 h-10"
                        />
                    </button>
                </div>

                {/* <div className="rounded-full w-10 h-10 bg-red-200 ml-auto"></div> */}
            </div>
            <div className="h-[1px] bg-black"></div>
        </div>
    );
}
