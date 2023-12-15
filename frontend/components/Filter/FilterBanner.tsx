import { ChevronDoubleRightIcon } from "@heroicons/react/24/outline";
import FitlerDialog from "../FilterDialog";
import BadmintonImage from "./../../public/images/badminton.png";
import BaseballImage from "./../../public/images/baseball.png";
import BasketballImage from "./../../public/images/basketball.png";
import PingPongImage from "./../../public/images/ping-pong.png";
import RugbyImage from "./../../public/images/rugby-ball.png";
import SoccerImage from "./../../public/images/soccer-ball.png";
import TennisImage from "./../../public/images/tennis-balls.png";
import VolleyballImage from "./../../public/images/volleyball.png";
import FilterIcon from "./FilterIcon";

export default function FilterBanner() {
  const icons = {
    Volleyball: { image: VolleyballImage, style: "w-8 h-8" },
    Badminton: { image: BadmintonImage, style: "w-8 h-8" },
    Basketball: { image: BasketballImage, style: "w-8 h-8" },
    Soccer: { image: SoccerImage, style: "w-8 h-8" },
    Tennis: { image: TennisImage, style: "w-8 h-8" },
    "Table Tennis": { image: PingPongImage, style: "w-8 h-8" },
    Oztag: { image: RugbyImage, style: "w-8 h-8" },
    Baseball: { image: BaseballImage, style: "w-8 h-8" },
  };
  return (
    // <div className="pt-16 bg-white px-5 md:px-[15vw]">
    <div className="pt-16 bg-white px-4 sm:px-0 w-full sm:w-[500px] md:w-[700px] lg:w-[1000px] xl:w-[1200px]">
      <div className="h-20 flex items-center mt-2">
        <div className="overflow-auto flex items-center my-2 snap-x">
          {Object.entries(icons).map((entry, idx) => {
            if (idx === 0) {
              return (
                <FilterIcon
                  key={idx}
                  image={entry[1].image}
                  style={entry[1].style}
                  name={entry[0]}
                  isFirst={true}
                />
              );
            }
            return (
              <FilterIcon
                key={idx}
                image={entry[1].image}
                style={entry[1].style}
                name={entry[0]}
                isFirst={false}
              />
            );
          })}
        </div>
        <div className="-left-5 ml-2 mr-8">
          <ChevronDoubleRightIcon className="md:hidden w-5 h-5" />
        </div>

        <div className="grow">
          <FitlerDialog />
        </div>
      </div>
    </div>
  );
}
