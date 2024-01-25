import Link from "next/link";
import ChevronRightButton from "../utility/ChevronRightButton";
import BadmintonImage from "./../../public/images/badminton.png";
import BaseballImage from "./../../public/images/baseball.png";
import BasketballImage from "./../../public/images/basketball.png";
import PingPongImage from "./../../public/images/ping-pong.png";
import RugbyImage from "./../../public/images/rugby-ball.png";
import SoccerImage from "./../../public/images/soccer-ball.png";
import TennisImage from "./../../public/images/tennis-balls.png";
import VolleyballImage from "./../../public/images/volleyball.png";
import SportIcon from "./SportIcon";

export default function SearchSport() {
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

  return (
    <div>
      <div className="w-full bg-gray-300 h-[1px] mt-10"></div>
      <div className="flex my-5">
        <h5 className="font-bold text-lg">Search by Sports</h5>
        <Link
          href="#"
          className="text-sm font-light ml-auto cursor-pointer hover:underline"
        >
          See all
        </Link>
      </div>
      <div className="flex items-center">
        <div
          id="sport-icon-carousel"
          className="w-full overflow-auto flex items-center my-2 snap-x snap-mandatory transition-all"
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
        <div className="ml-auto md:hidden">
          <ChevronRightButton handleClick={scroll} />
        </div>
      </div>
    </div>
  );
}
