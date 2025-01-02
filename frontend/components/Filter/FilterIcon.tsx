import { EventData } from "@/interfaces/EventTypes";
import { NO_SPORT_CHOSEN_STRING } from "@/services/src/filterService";
import Image, { StaticImageData } from "next/image";

interface FilterIconProps {
  sportIdentifierString: string;
  name: string;
  image: StaticImageData;
  style: string;
  isFirst: boolean;
  allEventsDataList: EventData[];
  setEventDataList: (events: EventData[]) => void;
  selectedSport: string;
  setSelectedSport: (sport: string) => void;
  applyFilters: (selectedSport: string) => Promise<void>;
}

export default function FilterIcon(props: FilterIconProps) {
  return (
    <button
      className={`${props.isFirst ? "mr-6 md:mr-8" : "min-w-[6rem] md:min-w-[8rem]"} flex justify-center snap-start`}
      onClick={() => {
        if (props.selectedSport === props.sportIdentifierString) {
          props.setSelectedSport(NO_SPORT_CHOSEN_STRING);
          props.applyFilters(NO_SPORT_CHOSEN_STRING);
        } else {
          props.setSelectedSport(props.sportIdentifierString);
          props.applyFilters(props.sportIdentifierString);
        }
      }}
    >
      <div>
        <div className="flex justify-center">
          <Image
            src={props.image}
            width={0}
            height={0}
            alt="volleyballImage"
            className={`${props.style} ${
              props.selectedSport === ""
                ? "opacity-100"
                : props.selectedSport === props.sportIdentifierString
                ? "opacity-100"
                : "opacity-50"
            } flex justify-center`}
          />
        </div>
        <p className="text-xs font-light grow text-center mb-1.5">{props.name}</p>
        {props.selectedSport === props.sportIdentifierString && <div className="bg-black h-[2px]"></div>}
      </div>
    </button>
  );
}
