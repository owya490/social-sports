"use client";

import { EventData } from "@/interfaces/EventTypes";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { DateRange, DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import ListBox from "../ListBox";

export enum SortByCategory {
  HOT,
  TOP_RATED,
  PRICE_ASCENDING,
  PRICE_DESCENDING,
  DATE_ASCENDING,
  DATE_DESCENDING,
}

export const DEFAULT_SORT_BY_CATEGORY = SortByCategory.DATE_DESCENDING;
export const HOT_SORTBY_STRING = "Hot";
export const TOP_RATED_SORTBY_STRING = "Top Rated";
export const PRICE_ASCENDING_SORTBY_STRING = "Price Ascending";
export const PRICE_DESCENDING_SORTBY_STRING = "Price Descending";
export const DATE_ASCENDING_SORTBY_STRING = "Date Ascending";
export const DATE_DESCENDING_SORTBY_STRING = "Date Descending";

export const DEFAULT_SEARCH = "";
export const DEFAULT_EVENT_STATUS = "";
export const DEFAULT_EVENT_TYPE = "";
export const DEFAULT_MIN_PRICE = null;
export const DEFAULT_MAX_PRICE = null;
export const DEFAULT_DATE_RANGE = {
  from: undefined as Date | undefined,
  to: undefined as Date | undefined,
};
export const DAY_START_TIME_STRING = " 00:00:00";
export const DAY_END_TIME_STRING = " 23:59:59";
export const EMPTY_LOCATION_STRING = "";

interface OrganiserFilterDialogProps {
  allEventsDataList: EventData[];
  setEventDataList: React.Dispatch<React.SetStateAction<any>>;

  sortByCategoryValue: SortByCategory;
  setSortByCategoryValue: React.Dispatch<React.SetStateAction<SortByCategory>>;

  searchValue: string;
  setSearchValue: React.Dispatch<React.SetStateAction<string>>;

  eventStatusValue: string;
  setEventStatusValue: React.Dispatch<React.SetStateAction<string>>;

  eventTypeValue: string;
  setEventTypeValue: React.Dispatch<React.SetStateAction<string>>;

  minPriceValue: number | null;
  setMinPriceValue: React.Dispatch<React.SetStateAction<number | null>>;

  maxPriceValue: number | null;
  setMaxPriceValue: React.Dispatch<React.SetStateAction<number | null>>;

  dateRange: DateRange;
  setDateRange: (dateRange: DateRange) => void;
  applyFilters: () => void;
}

export default function OrganiserFilterDialog({
  allEventsDataList,
  setEventDataList,
  sortByCategoryValue,
  setSortByCategoryValue,
  searchValue,
  setSearchValue,
  eventStatusValue,
  setEventStatusValue,
  eventTypeValue,
  setEventTypeValue,
  minPriceValue,
  setMinPriceValue,
  maxPriceValue,
  setMaxPriceValue,
  dateRange,
  setDateRange,
  applyFilters,
}: OrganiserFilterDialogProps) {
  const [showSortBy, setShowSortBy] = useState(true);
  const [showSearch, setShowSearch] = useState(true);
  const [showEventStatusAndType, setShowEventStatusAndType] = useState(true);
  const [showPriceRange, setShowPriceRange] = useState(true);
  const [showDateRange, setShowDateRange] = useState(true);

  const toggleShowSortBy = () => {
    setShowSortBy(!showSortBy);
  };
  const toggleShowSearch = () => {
    setShowSearch(!showSearch);
  };
  const toggleShowEventStatusAndType = () => {
    setShowEventStatusAndType(!showEventStatusAndType);
  };
  const toggleShowPriceRange = () => {
    setShowPriceRange(!showPriceRange);
  };
  const toggleShowDateRange = () => {
    setShowDateRange(!showDateRange);
  };

  const [sortByKey, setSortByKey] = useState(0);

  const updateSortByKey = () => {
    setSortByKey((prevKey) => prevKey + 1);
  };

  const handleDateRangeChange = (dateRange: DateRange | undefined) => {
    if (dateRange) {
      setDateRange(dateRange);
    } else {
      setDateRange(DEFAULT_DATE_RANGE);
    }
  };

  const toggleStatusCheckboxValue = (value: string) => {
    if (eventStatusValue === value) {
      setEventStatusValue(""); // Deselect if the same value is clicked
    } else {
      setEventStatusValue(value); // Set the selected value
    }
  };

  const toggleTypeCheckboxValue = (value: string) => {
    if (eventTypeValue === value) {
      setEventTypeValue("");
    } else {
      setEventTypeValue(value);
    }
  };

  function handleClearAll() {
    setSortByCategoryValue(DEFAULT_SORT_BY_CATEGORY);
    updateSortByKey();
    setSearchValue(DEFAULT_SEARCH);
    setEventStatusValue(DEFAULT_EVENT_STATUS);
    setEventTypeValue(DEFAULT_EVENT_TYPE);
    setMinPriceValue(DEFAULT_MIN_PRICE);
    setMaxPriceValue(DEFAULT_MAX_PRICE);
    setDateRange(DEFAULT_DATE_RANGE);
    setEventDataList([...allEventsDataList]);
  }

  return (
    <div className="max-h-screen">
      <div className="p-3 bg-gray-100 border border-gray-300 rounded-lg">
        <h2 className="text-base text-center font-semibold mb-3">Filter Events</h2>
        <div className="mb-3">
          <label className="text-xs font-medium text-gray-700 mb-1 flex items-center">
            Sort By
            <span className="cursor-pointer ml-auto" onClick={toggleShowSortBy}>
              {showSortBy ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
            </span>
          </label>
          {showSortBy && (
            <ListBox
              key={sortByKey}
              onChangeHandler={function (e: any): void {
                setSortByCategoryValue(e);
              }}
              options={[
                {
                  name: HOT_SORTBY_STRING,
                  value: SortByCategory.HOT,
                },
                {
                  name: TOP_RATED_SORTBY_STRING,
                  value: SortByCategory.TOP_RATED,
                },
                {
                  name: PRICE_ASCENDING_SORTBY_STRING,
                  value: SortByCategory.PRICE_ASCENDING,
                },
                {
                  name: PRICE_DESCENDING_SORTBY_STRING,
                  value: SortByCategory.PRICE_DESCENDING,
                },
                {
                  name: DATE_ASCENDING_SORTBY_STRING,
                  value: SortByCategory.DATE_ASCENDING,
                },
                {
                  name: DATE_DESCENDING_SORTBY_STRING,
                  value: SortByCategory.DATE_DESCENDING,
                },
              ]}
              sortByCategory={sortByCategoryValue}
              textSize="sm"
            />
          )}
        </div>
        <div className="mb-3">
          <label className="text-xs font-medium text-gray-700 mb-1 flex items-center">
            Search
            <span className="cursor-pointer ml-auto" onClick={toggleShowSearch}>
              {showSearch ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
            </span>
          </label>
          {showSearch && (
            <div className="mb-2">
              <input
                type="text"
                id="search"
                name="search"
                className="w-full p-1.5 text-sm border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                placeholder="Search for anything"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
          )}
        </div>
        <div className="mb-3">
          <label className="text-xs font-medium text-gray-700 mb-1 flex items-center">
            Event Status & Type
            <span className="cursor-pointer ml-auto" onClick={toggleShowEventStatusAndType}>
              {showEventStatusAndType ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
            </span>
          </label>
          {showEventStatusAndType && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-semibold text-gray-600 mb-1">Status</p>
                <div className="mb-1.5">
                  <label className="inline-flex items-center text-sm">
                    <input
                      type="checkbox"
                      name="Past"
                      value="Past"
                      className="mr-1.5 scale-90"
                      checked={eventStatusValue.includes("past")}
                      onChange={() => toggleStatusCheckboxValue("past")}
                    />
                    Past
                  </label>
                </div>
                <div className="mb-1.5">
                  <label className="inline-flex items-center text-sm">
                    <input
                      type="checkbox"
                      name="Future"
                      value="Future"
                      className="mr-1.5 scale-90"
                      checked={eventStatusValue.includes("future")}
                      onChange={() => toggleStatusCheckboxValue("future")}
                    />
                    Future
                  </label>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-600 mb-1">Type</p>
                <div className="mb-1.5">
                  <label className="inline-flex items-center text-sm">
                    <input
                      type="checkbox"
                      name="Public"
                      value="Public"
                      className="mr-1.5 scale-90"
                      checked={eventTypeValue.includes("public")}
                      onChange={() => toggleTypeCheckboxValue("public")}
                    />
                    Public
                  </label>
                </div>
                <div className="mb-1.5">
                  <label className="inline-flex items-center text-sm">
                    <input
                      type="checkbox"
                      name="Private"
                      value="Private"
                      className="mr-1.5 scale-90"
                      checked={eventTypeValue.includes("private")}
                      onChange={() => toggleTypeCheckboxValue("private")}
                    />
                    Private
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="mb-3">
          <label className="text-xs font-medium text-gray-700 mb-1 flex items-center">
            Price Range
            <span className="cursor-pointer ml-auto" onClick={toggleShowPriceRange}>
              {showPriceRange ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
            </span>
          </label>
          {showPriceRange && (
            <div className="flex justify-center items-center">
              <span className="text-gray-700 text-sm mr-1.5">$</span>
              <input
                type="text"
                id="minPrice"
                name="minPrice"
                placeholder="Min"
                className="w-full p-1.5 text-sm border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                value={minPriceValue !== null ? minPriceValue.toString() : ""}
                onChange={(e) => {
                  const newValue = parseFloat(e.target.value);
                  setMinPriceValue(isNaN(newValue) ? null : newValue);
                }}
              />
              <span className="text-gray-700 text-sm mx-1.5">to</span>
              <span className="text-gray-700 text-sm mr-1.5">$</span>
              <input
                type="text"
                id="maxPrice"
                name="maxPrice"
                placeholder="Max"
                className="w-full p-1.5 text-sm border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                value={maxPriceValue !== null ? maxPriceValue.toString() : ""}
                onChange={(e) => {
                  const newValue = parseFloat(e.target.value);
                  setMaxPriceValue(isNaN(newValue) ? null : newValue);
                }}
              />
            </div>
          )}
        </div>
        <div className="mb-3">
          <label className="text-xs font-medium text-gray-700 mb-1 flex items-center">
            Date Range
            <span className="cursor-pointer ml-auto" onClick={toggleShowDateRange}>
              {showDateRange ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
            </span>
          </label>
          {showDateRange && (
            <div className="flex justify-center w-full max-h-[260px] overflow-hidden">
              <DayPicker
                mode="range"
                selected={dateRange}
                onSelect={handleDateRangeChange}
                disabled={(date) => date < new Date()}
                classNames={{
                  selected: `bg-black text-white rounded-full`,
                  range_start: `bg-black text-white rounded-full`,
                  range_end: `bg-black text-white rounded-full`,
                  range_middle: `bg-gray-200 text-black rounded-full`,
                  today: `text-black font-bold`,
                  chevron: `text-black`,
                  disabled: `text-gray-400 cursor-not-allowed`,
                }}
                className="mt-1 scale-[75%] origin-top"
                styles={{
                  root: { fontSize: "0.875rem" },
                }}
              />
            </div>
          )}
          {dateRange?.from && (
            <p className="text-xs text-gray-600 mt-1 text-center">
              {dateRange.from.toLocaleDateString()}
              {dateRange.to && ` - ${dateRange.to.toLocaleDateString()}`}
            </p>
          )}
        </div>
        <div className="mt-4 w-full flex items-center">
          <button
            className="hover:underline cursor-pointer rounded-md bg-core-hover text-core-text px-4 py-2 text-sm font-medium border-[1px] border-core-text transition-all duration-300 transform"
            onClick={handleClearAll}
          >
            Clear all
          </button>
          <button
            type="button"
            className="ml-auto inline-flex justify-center rounded-md bg-black text-white px-4 py-2 text-sm font-medium hover:bg-white hover:text-black border-[1px] border-black transition-all duration-300 transform"
            onClick={applyFilters}
          >
            Apply Filters!
          </button>
        </div>
      </div>
    </div>
  );
}
