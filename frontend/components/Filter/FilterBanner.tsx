import { EventData } from "@/interfaces/EventTypes";
import { useState } from "react";
import ChevronRightButton from "../utility/ChevronRightButton";
import BadmintonImage from "./../../public/images/badminton.png";
import BaseballImage from "./../../public/images/baseball.png";
import BasketballImage from "./../../public/images/basketball.png";
import PingPongImage from "./../../public/images/ping-pong.png";
import RugbyImage from "./../../public/images/rugby-ball.png";
import SoccerImage from "./../../public/images/soccer-ball.png";
import TennisImage from "./../../public/images/tennis-balls.png";
import VolleyballImage from "./../../public/images/volleyball.png";
import FilterDialog, {
  DAY_END_TIME_STRING,
  DAY_START_TIME_STRING,
  DEFAULT_END_DATE,
  DEFAULT_MAX_PRICE,
  DEFAULT_MAX_PROXIMITY,
  DEFAULT_START_DATE,
} from "./FilterDialog";
import FilterIcon from "./FilterIcon";
import {
  filterEventsByDate,
  filterEventsByMaxProximity,
  filterEventsByPrice,
  filterEventsBySport,
} from "@/services/filterService";
import { Timestamp } from "firebase/firestore";
import {
  SYDNEY_LAT,
  SYDNEY_LNG,
  getLocationCoordinates,
} from "@/services/locationUtils";

interface FilterBannerProps {
  eventDataList: EventData[];
  allEventsDataList: EventData[];
  setEventDataList: React.Dispatch<React.SetStateAction<any>>;
}

export default function FilterBanner({
  eventDataList,
  allEventsDataList,
  setEventDataList,
}: FilterBannerProps) {
  // States for FilterDialog
  const [maxPriceSliderValue, setMaxPriceSliderValue] =
    useState<number>(DEFAULT_MAX_PRICE);
  /// Keeps track of what filter values were actually applied.
  const [appliedMaxPriceSliderValue, setAppliedMaxPriceSliderValue] =
    useState<number>(DEFAULT_MAX_PRICE);
  const [maxProximitySliderValue, setMaxProximitySliderValue] =
    useState<number>(DEFAULT_MAX_PROXIMITY); // max proximity in kms.
  const [appliedMaxProximitySliderValue, setAppliedMaxProximitySliderValue] =
    useState<number>(DEFAULT_MAX_PROXIMITY);
  const [dateRange, setDateRange] = useState<{
    startDate: string | null;
    endDate: string | null;
  }>({
    startDate: DEFAULT_START_DATE,
    endDate: DEFAULT_END_DATE,
  });
  const [appliedDateRange, setAppliedDateRange] = useState<{
    startDate: string | null;
    endDate: string | null;
  }>({
    startDate: DEFAULT_START_DATE,
    endDate: DEFAULT_END_DATE,
  });
  const [srcLocation, setSrcLocation] = useState<string>("");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);
  function closeModal() {
    setIsFilterModalOpen(false);
  }

  const [selectedSport, setSelectedSport] = useState("");

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

  const scroll = () => {
    document.getElementById("filter-overflow")?.scrollBy({
      top: 0,
      left: 50,
      behavior: "smooth",
    });
  };

  async function applyFilters(selectedSportProp: string) {
    console.log("selectedSport", selectedSportProp);
    let filteredEventDataList = [...allEventsDataList];

    // Filter by MAX PRICE
    let newEventDataList = filterEventsByPrice(
      [...filteredEventDataList],
      null,
      maxPriceSliderValue
    );
    filteredEventDataList = newEventDataList;
    setAppliedMaxPriceSliderValue(maxPriceSliderValue);

    // Filter by DATERANGE
    if (dateRange.startDate && dateRange.endDate) {
      newEventDataList = filterEventsByDate(
        [...filteredEventDataList],
        Timestamp.fromDate(
          new Date(dateRange.startDate + DAY_START_TIME_STRING)
        ), // TODO: needed to specify maximum time range on particular day.
        Timestamp.fromDate(new Date(dateRange.endDate + DAY_END_TIME_STRING))
      );
      filteredEventDataList = newEventDataList;
    }
    setAppliedDateRange(dateRange);

    // Filter by MAX PROXIMITY
    let srcLat = SYDNEY_LAT;
    let srcLng = SYDNEY_LNG;
    try {
      const { lat, lng } = await getLocationCoordinates(srcLocation);
      srcLat = lat;
      srcLng = lng;
    } catch (error) {
      console.log(error);
    }

    newEventDataList = filterEventsByMaxProximity(
      [...filteredEventDataList],
      maxProximitySliderValue,
      srcLat,
      srcLng
    );
    filteredEventDataList = newEventDataList;
    setAppliedMaxProximitySliderValue(maxProximitySliderValue);

    // Filter by SPORT
    newEventDataList = filterEventsBySport(
      [...filteredEventDataList],
      selectedSportProp
    );
    filteredEventDataList = newEventDataList;

    // TODO: add more filters

    setEventDataList([...filteredEventDataList]);
    console.log("filteredEvents", filteredEventDataList);
    closeModal();
  }

  return (
    <div className="pt-16 bg-white px-4 sm:px-0 screen-width-dashboard">
      <div className="h-20 flex items-center mt-2">
        <div
          id="filter-overflow"
          className="overflow-auto flex items-center my-2 snap-x snap-mandatory transition-all"
        >
          {Object.entries(icons).map((entry, idx) => {
            if (idx === 0) {
              return (
                <FilterIcon
                  key={idx}
                  image={entry[1].image}
                  style={entry[1].style}
                  name={entry[0]}
                  isFirst={true}
                  setEventDataList={setEventDataList}
                  allEventsDataList={eventDataList}
                  selectedSport={selectedSport}
                  setSelectedSport={setSelectedSport}
                  applyFilters={applyFilters}
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
                setEventDataList={setEventDataList}
                allEventsDataList={eventDataList}
                selectedSport={selectedSport}
                setSelectedSport={setSelectedSport}
                applyFilters={() => applyFilters(entry[0])}
              />
            );
          })}
        </div>
        <div className="-left-5 ml-2 mr-8 xl:hidden">
          <ChevronRightButton handleClick={scroll} />
        </div>

        <div className="grow">
          <FilterDialog
            allEventsDataList={allEventsDataList}
            setEventDataList={setEventDataList}
            maxPriceSliderValue={maxPriceSliderValue}
            setMaxPriceSliderValue={setMaxPriceSliderValue}
            appliedMaxPriceSliderValue={appliedMaxPriceSliderValue}
            setAppliedMaxPriceSliderValue={setAppliedMaxPriceSliderValue}
            maxProximitySliderValue={maxProximitySliderValue}
            setMaxProximitySliderValue={setMaxProximitySliderValue}
            appliedMaxProximitySliderValue={appliedMaxProximitySliderValue}
            setAppliedMaxProximitySliderValue={
              setAppliedMaxProximitySliderValue
            }
            dateRange={dateRange}
            setDateRange={setDateRange}
            appliedDateRange={appliedDateRange}
            setAppliedDateRange={setAppliedDateRange}
            srcLocation={srcLocation}
            setSrcLocation={setSrcLocation}
            applyFilters={() => applyFilters(selectedSport)}
            isFilterModalOpen={isFilterModalOpen}
            setIsFilterModalOpen={setIsFilterModalOpen}
            closeModal={closeModal}
          />
        </div>
      </div>
    </div>
  );
}
