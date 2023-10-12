import Image from "next/image";
import DP from "./../public/images/Ashley & Owen.png";
import ACERS from "./../public/images/acers.jpeg";
import GG from "./../public/images/gg.jpeg";
import PRO from "./../public/images/provolley.png";
import STV from "./../public/images/stv_image.jpeg";
import STVWOMEN from "./../public/images/stvvvv.jpg";
import v1 from "./../public/images/vball1.webp";
import v2 from "./../public/images/vball2.webp";
import v3 from "./../public/images/vball3.webp";
import Coin from "./../svgs/coin.svg";
import Location from "./../svgs/location.svg";

export default function EventCard() {
    const num = Math.floor(Math.random() * (7 - 0 + 1) + 0);
    const list = [GG, STV, STVWOMEN, PRO, ACERS, v1, v2, v3];
    return (
        <div className="bg-white rounded-xl min-w-xs max-w-xs">
            <Image
                src={list[num]}
                height={0}
                width={0}
                alt="stvImage"
                className="w-full rounded-t-xl h-36 object-cover"
            />
            <div className="p-4">
                <h4 className="font-bold text-gray-500 text-xs">
                    SAT, SEPT 23 · 20:00 AEST
                </h4>
                <h2 className="text-xl font-bold mb-1 mt-1">
                    Sydney Thunder Volleyball Men’s Training
                </h2>
                <div className="flex ml-0.5 items-center">
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
                <div className="mt-4 mb-7 space-y-3">
                    <div className="flex items-center">
                        {/* <LocationIcon /> */}
                        <Image src={Location} alt="coin" className="w-5" />
                        <p className="ml-1 font-light text-sm">
                            North Ryde RSL, NSW
                        </p>
                    </div>
                    <div className="flex items-center">
                        {/* <DollarSignIcon /> */}
                        <Image src={Coin} alt="coin" className="w-5" />

                        <p className="ml-1 font-light text-sm">
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
