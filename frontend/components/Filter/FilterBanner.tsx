"use client";

import { SPORTS_CONFIG } from "@/config/SportsConfig";
import { EventData } from "@/interfaces/EventTypes";
import {
  filterEventsByDate,
  filterEventsByMaxProximity,
  filterEventsByPrice,
  filterEventsBySortBy,
  filterEventsBySport,
} from "@/services/src/filterService";
import { SYDNEY_LAT, SYDNEY_LNG, getLocationCoordinates } from "@/services/src/maps/mapsService";
import { Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import ChevronRightButton from "../elements/ChevronRightButton";
import FilterDialog, {
  DAY_END_TIME_STRING,
  DAY_START_TIME_STRING,
  DEFAULT_DATE_RANGE,
  DEFAULT_MAX_PRICE,
  DEFAULT_MAX_PROXIMITY,
  DEFAULT_SORT_BY_CATEGORY,
  PRICE_SLIDER_MAX_VALUE,
  PROXIMITY_SLIDER_MAX_VALUE,
  SortByCategory,
} from "./FilterDialog";
import FilterIcon from "./FilterIcon";
import { DateRange } from "react-day-picker";

interface FilterBannerProps {
  eventDataList: EventData[];
  allEventsDataList: EventData[];
  setEventDataList: React.Dispatch<React.SetStateAction<any>>;
  srcLocation: string;
  setSrcLocation: React.Dispatch<React.SetStateAction<string>>;
  triggerFilterApply: boolean | undefined;
  endLoading: boolean | undefined;
  setEndLoading: (state: boolean | undefined) => void;
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
  const [dateRange, setDateRange] = useState<DateRange>(DEFAULT_DATE_RANGE);
  const [appliedDateRange, setAppliedDateRange] = useState<DateRange>(DEFAULT_DATE_RANGE);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);
  function closeModal() {
    setIsFilterModalOpen(false);
  }

  const [selectedSport, setSelectedSport] = useState("");

  const scroll = () => {
    document.getElementById("filter-overflow")?.scrollBy({
      top: 0,
      left: 50,
      behavior: "smooth",
    });
  };

  async function applyFilters(selectedSportProp: string): Promise<void> {
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
    if (dateRange.from && dateRange.to) {
      let newEventDataList = filterEventsByDate(
        [...filteredEventDataList],
        Timestamp.fromDate(new Date(dateRange.from.toISOString().split("T")[0] + DAY_START_TIME_STRING)),
        Timestamp.fromDate(new Date(dateRange.to.toISOString().split("T")[0] + DAY_END_TIME_STRING))
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
    <div className=" w-full px-3">
      <div className="h-20 flex items-center mt-2 w-full lg:px-10 xl:px-16 2xl:px-24 3xl:px-40">
        <div
          id="filter-overflow"
          className="overflow-auto flex items-center my-2 snap-x snap-mandatory transition-all no-scrollbar"
        >
          {Object.entries(SPORTS_CONFIG).map((entry, idx) => {
            const sportIdentifierString = entry[0];
            const sportInfo = entry[1];
            if (idx === 0) {
              return (
                <FilterIcon
                  key={idx}
                  sportIdentifierString={sportIdentifierString}
                  image={sportInfo.iconImage}
                  style={"h-8 w-8"}
                  name={sportInfo.name}
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
                image={sportInfo.iconImage}
                style={"h-8 w-8"}
                name={sportInfo.name}
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
