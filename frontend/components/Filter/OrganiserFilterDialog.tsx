"use client";

import { EventData } from "@/interfaces/EventTypes";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import Datepicker from "react-tailwindcss-datepicker";
import ListBox from "../ListBox";

export enum SortByCategory {
  HOT,
  TOP_RATED,
  PRICE_ASCENDING,
  PRICE_DESCENDING,
  DATE_ASCENDING,
  DATE_DESCENDING,
}

export const DEFAULT_SORT_BY_CATEGORY = SortByCategory.HOT;
export const HOT_SORTBY_STRING = "Hot";
export const TOP_RATED_SORTBY_STRING = "Top Rated";
export const PRICE_ASCENDING_SORTBY_STRING = "Price Ascending";
export const PRICE_DESCENDING_SORTBY_STRING = "Price Descending";
export const DATE_ASCENDING_SORTBY_STRING = "Date Ascending";
export const DATE_DESCENDING_SORTBY_STRING = "Date Descending";

export const DEFAULT_SEARCH = "";
export const DEFAULT_EVENT_STATUS = "";
export const DEFAULT_EVENT_TYPE = "";
export const DEFAULT_MIN_PRICE = "";
export const DEFAULT_MAX_PRICE = "";
export const DEFAULT_START_DATE = "";
export const DEFAULT_END_DATE = "";
export const DAY_START_TIME_STRING = " 00:00:00";
export const DAY_END_TIME_STRING = " 23:59:59";

export const EMPTY_LOCATION_STRING = "";

export const [showSortBy, setShowSortBy] = useState(true);
export const [showSearch, setShowSearch] = useState(true);
export const [showEventStatus, setShowEventStatus] = useState(true);
export const [showEventType, setShowEventType] = useState(true);
export const [showPriceRange, setShowPriceRange] = useState(true);
export const [showDateRange, setShowDateRange] = useState(true);

export const toggleShowSortBy = () => {
  setShowSearch(!showSortBy);
};
export const toggleShowSearch = () => {
  setShowSearch(!showSearch);
};
export const toggleShowEventStatus = () => {
  setShowEventStatus(!showEventStatus);
};
export const toggleShowEventType = () => {
  setShowEventType(!showEventType);
};
export const toggleShowPriceRange = () => {
  setShowPriceRange(!showPriceRange);
};
export const toggleShowDateRange = () => {
  setShowDateRange(!showDateRange);
};

interface OrganiserFilterDialogProps {
  eventDataList: EventData[];
  setEventDataList: React.Dispatch<React.SetStateAction<any>>;

  sortByCategoryValue: SortByCategory;
  setSortByCategoryValue: React.Dispatch<React.SetStateAction<SortByCategory>>;
  appliedSortByCategoryValue: SortByCategory;
  setAppliedSortByCategoryValue: React.Dispatch<React.SetStateAction<SortByCategory>>;

  searchValue: string | undefined;
  setSearchValue: React.Dispatch<React.SetStateAction<string | undefined>>;

  eventStatusValue: string;
  setEventStatusValue: React.Dispatch<React.SetStateAction<string>>;

  eventTypeValue: string;
  setEventTypeValue: React.Dispatch<React.SetStateAction<string>>;

  minPriceValue: string;
  setMinPriceValue: React.Dispatch<React.SetStateAction<string>>;
  maxPriceValue: string;
  setMaxPriceValue: React.Dispatch<React.SetStateAction<string>>;

  dateRange: {
    startDate: string;
    endDate: string;
  };
  setDateRange: React.Dispatch<
    React.SetStateAction<{
      startDate: string;
      endDate: string;
    }>
  >;
  appliedDateRange: {
    startDate: string;
    endDate: string;
  };
  setAppliedDateRange: React.Dispatch<
    React.SetStateAction<{
      startDate: string;
      endDate: string;
    }>
  >;
  applyFilters: () => Promise<void>;
}

export default function OrganiserFilterDialog({
  eventDataList,
  setEventDataList,
  sortByCategoryValue,
  setSortByCategoryValue,
  appliedSortByCategoryValue,
  setAppliedSortByCategoryValue,
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
  appliedDateRange,
  setAppliedDateRange,
  applyFilters,
}: OrganiserFilterDialogProps) {
  const handleDateRangeChange = (dateRange: any) => {
    if (dateRange.startDate && dateRange.endDate) {
      let timestampDateRange = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      };

      setDateRange(timestampDateRange);
    } else {
      let timestampDateRange = {
        startDate: DEFAULT_START_DATE,
        endDate: DEFAULT_END_DATE,
      };

      setDateRange(timestampDateRange);
    }
  };

  function handleClearAll() {
    setSearchValue(DEFAULT_SEARCH);
    setEventStatusValue(DEFAULT_EVENT_STATUS);
    setEventTypeValue(DEFAULT_EVENT_TYPE);
    setMinPriceValue(DEFAULT_MIN_PRICE);
    setMaxPriceValue(DEFAULT_MAX_PRICE);

    setDateRange({
      startDate: DEFAULT_START_DATE,
      endDate: DEFAULT_END_DATE,
    });
    setAppliedDateRange({
      startDate: DEFAULT_START_DATE,
      endDate: DEFAULT_END_DATE,
    });

    setEventDataList([...eventDataList]);
  }

  return (
    <div className="w-[360px] mr-2 2xl:mr-6 max-h-screen overflow-y-auto">
      <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg">
        <h2 className="text-lg text-center font-semibold mb-4">Filter Events</h2>
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
            Sort By
            <span className="cursor-pointer ml-auto" onClick={toggleShowSearch}>
              {showSortBy ? <ChevronUpIcon className="h-6 w-6" /> : <ChevronDownIcon className="h-6 w-6" />}
            </span>
          </label>
          {showSortBy && (
            <ListBox
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
                  name: DATE_ASCENDING_SORTBY_STRING,
                  value: SortByCategory.DATE_ASCENDING,
                },
                {
                  name: DATE_DESCENDING_SORTBY_STRING,
                  value: SortByCategory.DATE_DESCENDING,
                },
              ]}
              sortByCategory={sortByCategoryValue}
            />
          )}
        </div>
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
            Search
            <span className="cursor-pointer ml-auto" onClick={toggleShowSearch}>
              {showSearch ? <ChevronUpIcon className="h-6 w-6" /> : <ChevronDownIcon className="h-6 w-6" />}
            </span>
          </label>
          {showSearch && (
            <div className="mb-4">
              <input
                type="text"
                id="search"
                name="search"
                className="w-full p-2 border rounded-xl focus:outline-none focus:ring focus:border-blue-300"
                placeholder="Search for anything"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
          )}
        </div>
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
            Event Status
            <span className="cursor-pointer ml-auto" onClick={toggleShowEventStatus}>
              {showEventStatus ? <ChevronUpIcon className="h-6 w-6" /> : <ChevronDownIcon className="h-6 w-6" />}
            </span>
          </label>
          {showEventStatus && (
            <div>
              <div className="mb-2">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="Past"
                    value="Past"
                    className="mr-2"
                    checked={eventStatusValue.includes("Past")}
                    onChange={() => setEventStatusValue("Past")}
                  />
                  Past
                </label>
              </div>
              <div className="mb-2">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="Future"
                    value="Future"
                    className="mr-2"
                    checked={eventStatusValue.includes("Future")}
                    onChange={() => setEventStatusValue("Future")}
                  />
                  Future
                </label>
              </div>
            </div>
          )}
        </div>
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
            Event Type
            <span className="cursor-pointer ml-auto" onClick={toggleShowEventType}>
              {showEventType ? <ChevronUpIcon className="h-6 w-6" /> : <ChevronDownIcon className="h-6 w-6" />}
            </span>
          </label>
          {showEventType && (
            <div>
              <div className="mb-2">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="Public"
                    value="Public"
                    className="mr-2"
                    checked={eventTypeValue.includes("Public")}
                    onChange={() => setEventTypeValue("Public")}
                  />
                  Public
                </label>
              </div>
              <div className="mb-2">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="Private"
                    value="Private"
                    className="mr-2"
                    checked={eventTypeValue.includes("Private")}
                    onChange={() => setEventTypeValue("Private")}
                  />
                  Private
                </label>
              </div>
            </div>
          )}
        </div>
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
            Price Range
            <span className="cursor-pointer ml-auto" onClick={toggleShowPriceRange}>
              {showPriceRange ? <ChevronUpIcon className="h-6 w-6" /> : <ChevronDownIcon className="h-6 w-6" />}
            </span>
          </label>
          {showPriceRange && (
            <div className="flex justify-center items-center">
              <span className="text-gray-700 mr-2">$</span>
              <input
                type="text"
                id="minPrice"
                name="minPrice"
                placeholder="Min"
                className="w-full p-2 border rounded-xl focus:outline-none focus:ring focus:border-blue-300"
                value={minPriceValue}
                onChange={(e) => setMinPriceValue(e.target.value.replace(/[^0-9.]/g, ""))}
              />
              <span className="text-gray-700 mx-2">to</span>
              <span className="text-gray-700 mr-2">$</span>
              <input
                type="text"
                id="maxPrice"
                name="maxPrice"
                placeholder="Max"
                className="w-full p-2 border rounded-xl focus:outline-none focus:ring focus:border-blue-300"
                value={maxPriceValue}
                onChange={(e) => setMaxPriceValue(e.target.value.replace(/[^0-9.]/g, ""))}
              />
            </div>
          )}
        </div>
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-1 flex items-center min-w-[325px]">
            Date Range
            <span className="cursor-pointer ml-auto" onClick={toggleShowDateRange}>
              {showDateRange ? <ChevronUpIcon className="h-6 w-6" /> : <ChevronDownIcon className="h-6 w-6" />}
            </span>
          </label>
          {showDateRange && (
            <div className="flex justify-start items-center">
              <Datepicker
                value={dateRange}
                separator="to"
                displayFormat={"DD/MM/YYYY"}
                onChange={handleDateRangeChange}
                inputClassName="w-full p-2 border rounded-xl focus:outline-none focus:ring focus:border-blue-300"
              />
            </div>
          )}
        </div>
        <div className="mt-5 w-full flex items-center">
          <button className="hover:underline cursor-pointer" onClick={handleClearAll}>
            Clear all
          </button>
          <button
            type="button"
            className="ml-auto inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            onClick={applyFilters}
          >
            Apply Filters!
          </button>
        </div>
      </div>
    </div>
  );
}
