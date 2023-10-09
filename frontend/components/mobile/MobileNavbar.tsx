import Image from "next/image";
import DP from "./../../public/images/Ashley & Owen.png";
import Logo from "./../../public/images/Logo.png";

export default function MobileNavbar() {
    return (
        <div className="bg-white drop-shadow-lg fixed top-0 w-screen z-50">
            <div className="flex items-center py-2 px-4">
                <Image
                    src={Logo}
                    alt="Logo"
                    width={50}
                    height={50}
                    className="w-12 mx-1"
                />
                <h1 className="font-robotocondensed text-2xl font-extrabold mr-20">
                    SOCIAL SPORTS
                </h1>

                <div className="flex ml-auto items-center">
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
