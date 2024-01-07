"use client";
import RecommendedEvents from "@/components/events/RecommendedEvents";
import CreateEventBanner from "@/components/home/CreateEventBanner";
import LoadingOverlay from "@/components/home/LoadingOverlay";
import PopularEvents from "@/components/home/PopularEvents";
import PopularLocations from "@/components/home/PopularLocations";
import SportIcon from "@/components/home/SportIcon";
import ChevronRightButton from "@/components/utility/ChevronRightButton";
import { sleep } from "@/components/utility/sleepUtil";
import { Input } from "@material-tailwind/react";
import Image from "next/image";
import { useEffect } from "react";
import BadmintonImage from "./../public/images/badminton.png";
import BaseballImage from "./../public/images/baseball.png";
import HeroImage from "./../public/images/basketball-hero.png";
import BasketballImage from "./../public/images/basketball.png";
import PingPongImage from "./../public/images/ping-pong.png";
import RugbyImage from "./../public/images/rugby-ball.png";
import SoccerImage from "./../public/images/soccer-ball.png";
import TennisImage from "./../public/images/tennis-balls.png";
import VolleyballArt from "./../public/images/volleyball-digging.png";
import VolleyballImage from "./../public/images/volleyball.png";

export default function Home() {
  const icons = {
    Volleyball: { image: VolleyballImage },
    Badminton: { image: BadmintonImage },
    Basketball: { image: BasketballImage },
    Soccer: { image: SoccerImage },
    Tennis: { image: TennisImage },
    "Table Tennis": { image: PingPongImage },
    Oztag: { image: RugbyImage },
    Baseball: { image: BaseballImage },
  };

  const scroll = () => {
    document.getElementById("sport-icon-carousel")?.scrollBy({
      top: 0,
      left: 50,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    async function init() {
      await sleep(2100);
      document.getElementById("page")!.classList.remove("hidden");
    }
    init();
  });

  return (
    <div>
      <LoadingOverlay />
      <div id="page" className="hidden">
        <div className="mt-20 w-screen justify-center flex">
          <div className="screen-width-dashboard">
            <div className="grid grid-cols-2 mt-8">
              <div className="w-full flex justify-center items-center">
                <div>
                  <h1 className="text-6xl font-extrabold">
                    Satisfy your Sports Cravings.
                  </h1>
                  <p className="font-thin mt-4">
                    Find your next Social Sports Session right here on{" "}
                    <a href="/dashboard" className="font-semibold">
                      Sports Hub.
                    </a>
                  </p>
                </div>
              </div>
              <div>
                <Image
                  src={HeroImage}
                  height={0}
                  width={0}
                  alt="..."
                  className="w-full object-cover"
                />
              </div>
            </div>
            <div className="w-full bg-gray-300 h-[1px] mt-10"></div>
            <div className="flex my-5">
              <h5 className="font-bold text-lg">Search by Sports</h5>
              <a className="text-sm font-light ml-auto cursor-pointer hover:underline">
                See all
              </a>
            </div>
            <div
              id="sport-icon-carousel"
              className="overflow-auto flex items-center my-2 snap-x snap-mandatory transition-all"
            >
              {Object.entries(icons).map((entry, idx) => {
                if (idx === 0) {
                  return (
                    <SportIcon
                      key={idx}
                      image={entry[1].image}
                      name={entry[0]}
                      isFirst={true}
                    />
                  );
                }
                return (
                  <SportIcon
                    key={idx}
                    image={entry[1].image}
                    name={entry[0]}
                    isFirst={false}
                  />
                );
              })}
            </div>
            <div className="-left-5 ml-2 mr-8 xl:hidden">
              <ChevronRightButton handleClick={scroll} />
            </div>
          </div>
        </div>
        <RecommendedEvents />
        <div></div>
        <div className="my-36 w-screen flex justify-center">
          <div className="screen-width-dashboard">
            <div className="grid grid-cols-3">
              <div className="col-span-2">
                <Image
                  src={VolleyballArt}
                  height={0}
                  width={0}
                  alt="..."
                  className="ml-auto"
                />
              </div>
              <div className=" flex justify-center items-center ml-5">
                <div className="h-fit">
                  <h1 className="text-3xl font-semibold lg:text-4xl">
                    Subscribe To The <span className="">Newsletter</span>
                  </h1>
                  <p className="mt-3 font-thin italic">
                    be the first to knows when our{" "}
                    <span className="font-bold">Brand</span> is live
                  </p>

                  <div className="flex flex-col mt-6 space-y-3 lg:space-y-0 lg:flex-row">
                    <Input
                      crossOrigin={undefined}
                      label="Email Address"
                      variant="outlined"
                    />
                    <button className="w-full px-5 py-2 text-sm tracking-wider uppercase transition-colors duration-300 transform border border-black rounded-lg lg:w-auto lg:mx-4 hover:bg-black hover:text-white">
                      Subscribe
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <PopularLocations />
        <PopularEvents />
        <CreateEventBanner />
      </div>
    </div>
  );
}
