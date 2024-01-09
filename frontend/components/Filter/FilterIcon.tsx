import { EventData } from "@/interfaces/EventTypes";
import { filterEventsBySport } from "@/services/filterService";
import Image, { StaticImageData } from "next/image";

interface FilterIconProps {
  name: string;
  image: StaticImageData;
  style: string;
  isFirst: boolean;
  allEventsDataList: EventData[];
  setEventDataList: (events: EventData[]) => void;
  selectedSport: string;
  setSelectedSport: (sport: string) => void;
}

export default function FilterIcon(props: FilterIconProps) {
  return (
    <button
      className={`${
        props.isFirst ? "mr-6 md:mr-8" : "min-w-[6rem] md:min-w-[8rem]"
      } flex justify-center snap-start`}
      onClick={() => {
        if (props.selectedSport === props.name) {
          props.setEventDataList(props.allEventsDataList);
          props.setSelectedSport("");
        } else {
          props.setEventDataList(
            filterEventsBySport(
              props.allEventsDataList,
              props.name.toLowerCase()
            )
          );
          props.setSelectedSport(props.name);
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
                ? "grayscale-0"
                : props.selectedSport === props.name
                ? "grayscale-0"
                : "grayscale"
            } flex justify-center`}
          />
        </div>
        <p className="text-sm font-light grow text-center">{props.name}</p>
      </div>
    </button>
  );
}
