"use client";

import { EventData } from "@/interfaces/EventTypes";
import {
  filterEventsByDate,
  filterEventsByMaxProximity,
  filterEventsByPrice,
  filterEventsBySortBy,
  filterEventsBySport,
} from "@/services/src/filterService";
import { SYDNEY_LAT, SYDNEY_LNG, getLocationCoordinates } from "@/services/src/locationUtils";
import { Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import ChevronRightButton from "../elements/ChevronRightButton";
import BadmintonImage from "./../../public/images/badminton.png";
import BaseballImage from "./../../public/images/baseball.png";
import BasketballImage from "./../../public/images/basketball.png";
import PingPongImage from "./../../public/images/ping-pong.png";
import RugbyImage from "./../../public/images/rugby-ball.png";
import SoccerImage from "./../../public/images/soccer-ball.png";
import TennisImage from "./../../public/images/tennis-balls.png";
import VolleyballImage from "./../../public/images/volleyball.png";
import FilterDialog, {
  BADMINTON_SPORT_STRING,
  BASEBALL_SPORT_STRING,
  BASKETBALL_SPORT_STRING,
  DAY_END_TIME_STRING,
  DAY_START_TIME_STRING,
  DEFAULT_END_DATE,
  DEFAULT_MAX_PRICE,
  DEFAULT_MAX_PROXIMITY,
  DEFAULT_SORT_BY_CATEGORY,
  DEFAULT_START_DATE,
  OZTAG_SPORT_STRING,
  PRICE_SLIDER_MAX_VALUE,
  PROXIMITY_SLIDER_MAX_VALUE,
  SOCCER_SPORT_STRING,
  SortByCategory,
  TABLE_TENNIS_SPORT_STRING,
  TENNIS_SPORT_STRING,
  VOLLEYBALL_SPORT_STRING,
} from "./FilterDialog";
import FilterIcon from "./FilterIcon";

interface FilterBannerProps {
  eventDataList: EventData[];
  allEventsDataList: EventData[];
  setEventDataList: React.Dispatch<React.SetStateAction<any>>;
  srcLocation: string;
  setSrcLocation: React.Dispatch<React.SetStateAction<string>>;
  triggerFilterApply: boolean | undefined;
  endLoading: boolean | undefined;
  setEndLoading: (_state: boolean | undefined) => void;
}

export default function FilterBanner({
  eventDataList,
  setEventDataList,
  srcLocation,
  setSrcLocation,
  triggerFilterApply,
  endLoading,
  setEndLoading,
}: FilterBannerProps) {
  const [sortByCategoryValue, setSortByCategoryValue] = useState<SortByCategory>(DEFAULT_SORT_BY_CATEGORY);
  const [appliedSortByCategoryValue, setAppliedSortByCategoryValue] =
    useState<SortByCategory>(DEFAULT_SORT_BY_CATEGORY);
  const [maxPriceSliderValue, setMaxPriceSliderValue] = useState<number>(DEFAULT_MAX_PRICE);
  /// Keeps track of what filter values were actually applied.
  const [appliedMaxPriceSliderValue, setAppliedMaxPriceSliderValue] = useState<number>(DEFAULT_MAX_PRICE);
  const [maxProximitySliderValue, setMaxProximitySliderValue] = useState<number>(DEFAULT_MAX_PROXIMITY); // max proximity in kms.
  const [appliedMaxProximitySliderValue, setAppliedMaxProximitySliderValue] = useState<number>(DEFAULT_MAX_PROXIMITY);
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
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);
  function closeModal() {
    setIsFilterModalOpen(false);
  }

  const [selectedSport, setSelectedSport] = useState("");

  const icons = {
    volleyball: {
      image: VolleyballImage,
      style: "w-8 h-8",
      sport_name: VOLLEYBALL_SPORT_STRING,
    },
    badminton: {
      image: BadmintonImage,
      style: "w-8 h-8",
      sport_name: BADMINTON_SPORT_STRING,
    },
    basketball: {
      image: BasketballImage,
      style: "w-8 h-8",
      sport_name: BASKETBALL_SPORT_STRING,
    },
    soccer: {
      image: SoccerImage,
      style: "w-8 h-8",
      sport_name: SOCCER_SPORT_STRING,
    },
    tennis: {
      image: TennisImage,
      style: "w-8 h-8",
      sport_name: TENNIS_SPORT_STRING,
    },
    "table tennis": {
      image: PingPongImage,
      style: "w-8 h-8",
      sport_name: TABLE_TENNIS_SPORT_STRING,
    },
    oztag: {
      image: RugbyImage,
      style: "w-8 h-8",
      sport_name: OZTAG_SPORT_STRING,
    },
    baseball: {
      image: BaseballImage,
      style: "w-8 h-8",
      sport_name: BASEBALL_SPORT_STRING,
    },
  };

  const scroll = () => {
    document.getElementById("filter-overflow")?.scrollBy({
      top: 0,
      left: 50,
      behavior: "smooth",
    });
  };

  async function applyFilters(selectedSportProp: string) {
    console.log("FILTERING", srcLocation);
    const isAnyPriceBool = maxPriceSliderValue === PRICE_SLIDER_MAX_VALUE;
    // changed it so that instead of it running only if its not max, if locaiton is not ""
    const isAnyProximityBool = srcLocation === "" || maxProximitySliderValue === PROXIMITY_SLIDER_MAX_VALUE;

    let filteredEventDataList = [...eventDataList];
    console.log(srcLocation);
    // Filter by MAX PRICE
    if (!isAnyPriceBool) {
      let newEventDataList = filterEventsByPrice([...filteredEventDataList], null, maxPriceSliderValue);
      filteredEventDataList = newEventDataList;
    }
    setAppliedMaxPriceSliderValue(maxPriceSliderValue);

    // Filter by DATERANGE
    if (dateRange.startDate && dateRange.endDate) {
      let newEventDataList = filterEventsByDate(
        [...filteredEventDataList],
        Timestamp.fromDate(new Date(dateRange.startDate + DAY_START_TIME_STRING)), // TODO: needed to specify maximum time range on particular day.
        Timestamp.fromDate(new Date(dateRange.endDate + DAY_END_TIME_STRING))
      );
      filteredEventDataList = newEventDataList;
    }
    setAppliedDateRange(dateRange);

    // Filter by MAX PROXIMITY
    if (!isAnyProximityBool) {
      let srcLat = SYDNEY_LAT;
      let srcLng = SYDNEY_LNG;
      console.log("LOCATION", srcLocation);
      try {
        const { lat, lng } = await getLocationCoordinates(srcLocation);
        srcLat = lat;
        srcLng = lng;
      } catch (error) {
        console.log(error);
      }

      let newEventDataList = filterEventsByMaxProximity(
        [...filteredEventDataList],
        maxProximitySliderValue,
        srcLat,
        srcLng
      );
      filteredEventDataList = newEventDataList;
    }
    setAppliedMaxProximitySliderValue(maxProximitySliderValue);

    // Filter by SPORT
    let newEventDataList = filterEventsBySport([...filteredEventDataList], selectedSportProp);
    filteredEventDataList = newEventDataList;

    // Filter by SORT BY
    newEventDataList = filterEventsBySortBy([...filteredEventDataList], sortByCategoryValue);
    filteredEventDataList = newEventDataList;
    setAppliedSortByCategoryValue(sortByCategoryValue);

    // TODO: add more filters

    setEventDataList([...filteredEventDataList]);
    closeModal();
  }

  useEffect(() => {
    if (triggerFilterApply !== undefined) {
      applyFilters(selectedSport).finally(() => {
        if (endLoading === undefined) {
          setEndLoading(true);
        } else {
          setEndLoading(!endLoading);
        }
      });
    }
  }, [triggerFilterApply]);

  return (
    <div className="pt-16 bg-white px-4 sm:px-0 screen-width-dashboard">
      <div className="h-20 flex items-center mt-2">
        <div id="filter-overflow" className="overflow-auto flex items-center my-2 snap-x snap-mandatory transition-all">
          {Object.entries(icons).map((entry, idx) => {
            const sportIdentifierString = entry[0];
            const sportInfo = entry[1];
            if (idx === 0) {
              return (
                <FilterIcon
                  key={idx}
                  sportIdentifierString={sportIdentifierString}
                  image={sportInfo.image}
                  style={sportInfo.style}
                  name={sportInfo.sport_name}
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
                sportIdentifierString={sportIdentifierString}
                image={sportInfo.image}
                style={sportInfo.style}
                name={sportInfo.sport_name}
                isFirst={false}
                setEventDataList={setEventDataList}
                allEventsDataList={eventDataList}
                selectedSport={selectedSport}
                setSelectedSport={setSelectedSport}
                applyFilters={applyFilters}
              />
            );
          })}
        </div>
        <div className="-left-5 ml-2 mr-8 xl:hidden">
          <ChevronRightButton handleClick={scroll} />
        </div>

        <div className="grow">
          <FilterDialog
            eventDataList={eventDataList}
            setEventDataList={setEventDataList}
            sortByCategoryValue={sortByCategoryValue}
            setSortByCategoryValue={setSortByCategoryValue}
            appliedSortByCategoryValue={appliedSortByCategoryValue}
            setAppliedSortByCategoryValue={setAppliedSortByCategoryValue}
            maxPriceSliderValue={maxPriceSliderValue}
            setMaxPriceSliderValue={setMaxPriceSliderValue}
            appliedMaxPriceSliderValue={appliedMaxPriceSliderValue}
            setAppliedMaxPriceSliderValue={setAppliedMaxPriceSliderValue}
            maxProximitySliderValue={maxProximitySliderValue}
            setMaxProximitySliderValue={setMaxProximitySliderValue}
            appliedMaxProximitySliderValue={appliedMaxProximitySliderValue}
            setAppliedMaxProximitySliderValue={setAppliedMaxProximitySliderValue}
            dateRange={dateRange}
            setDateRange={setDateRange}
            appliedDateRange={appliedDateRange}
            setAppliedDateRange={setAppliedDateRange}
            srcLocation={srcLocation}
            setSrcLocation={setSrcLocation}
            selectedSport={selectedSport}
            setSelectedSport={setSelectedSport}
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
