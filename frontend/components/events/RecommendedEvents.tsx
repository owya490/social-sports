import Image from "next/image";
import DP from "./../../public/images/Ashley & Owen.png";
import STV from "./../../public/images/stv_image.jpeg";
import Coin from "./../../svgs/coin.svg";
import Location from "./../../svgs/location.svg";

export default function RecommendedEvents() {
    return (
        <div className="bg-white rounded-xl border max-w-xs">
            <Image
                src={STV}
                alt="stv"
                height={0}
                width={0}
                className="rounded-t-xl w-full h-28 object-cover"
            />
            <div className="p-4">
                <h4 className="font-bold text-gray-500 text-xs">
                    SAT, SEPT 23 · 20:00 AEST
                </h4>
                <h2 className="text-xl font-bold my-2">
                    Sydney Thunder Volleyball Men’s Training
                </h2>
                <div className="flex items-center ml-1">
                    <Image
                        src={DP}
                        alt="DP"
                        width={50}
                        height={50}
                        className="rounded-full w-4 h-4"
                    />
                    <p className="text-xs font-light ml-1">
                        Hosted by Tzeyen Rossiter
                    </p>
                </div>
                <div className="pl-2 my-4 space-y-3">
                    <div className="flex items-center">
                        {/* <LocationIcon /> */}
                        <Image src={Location} alt="coin" className="w-5" />
                        <p className="ml-1 font-light text-xs">
                            North Ryde RSL, NSW
                        </p>
                    </div>
                    <div className="flex items-center">
                        {/* <DollarSignIcon /> */}
                        <Image src={Coin} alt="coin" className="w-5" />

                        <p className="ml-1 font-light text-xs">
                            $30.00 AUD per person
                        </p>
                    </div>
                </div>
                <div className="flex items-center">
                    <p className="text-sm font-light text-gray-500">
                        5 spots left
                    </p>
                    <button className="ml-auto rounded-full bg-[#30ADFF] py-1 px-2 text-white">
                        <h2 className="text-sm">Book Now</h2>
                    </button>
                </div>
            </div>
        </div>
    );
}
