"use client";

import { EventData } from "@/interfaces/EventTypes";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { useMemo, useState } from "react";
import Datepicker from "react-tailwindcss-datepicker";
import ListBox from "../ListBox";
import { HighlightButton } from "../elements/HighlightButton";

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
export const DEFAULT_MIN_PRICE = null;
export const DEFAULT_MAX_PRICE = null;
export const DEFAULT_START_DATE = "";
export const DEFAULT_END_DATE = "";
export const defaultDateRange = {
  startDate: DEFAULT_START_DATE,
  endDate: DEFAULT_END_DATE,
};
export const DAY_START_TIME_STRING = " 00:00:00";
export const DAY_END_TIME_STRING = " 23:59:59";
export const EMPTY_LOCATION_STRING = "";

interface OrganiserFilterDialogProps {
  eventDataList: EventData[];
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
  const [showEventStatus, setShowEventStatus] = useState(true);
  const [showEventType, setShowEventType] = useState(true);
  const [showPriceRange, setShowPriceRange] = useState(true);
  const [showDateRange, setShowDateRange] = useState(true);

  const toggleShowSortBy = () => {
    setShowSortBy(!showSortBy);
  };
  const toggleShowSearch = () => {
    setShowSearch(!showSearch);
  };
  const toggleShowEventStatus = () => {
    setShowEventStatus(!showEventStatus);
  };
  const toggleShowEventType = () => {
    setShowEventType(!showEventType);
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

  const [datepickerKey, setDatepickerKey] = useState(0);

  const updateDatepickerKey = () => {
    setDatepickerKey((prevKey) => prevKey + 1);
  };

  const DatepickerComponent = useMemo(
    () => (
      <Datepicker
        key={datepickerKey}
        value={{
          startDate: dateRange && dateRange.startDate ? new Date(dateRange.startDate) : new Date(),
          endDate: dateRange && dateRange.endDate ? new Date(dateRange.endDate) : new Date(),
        }}
        separator="to"
        displayFormat={"DD/MM/YYYY"}
        onChange={handleDateRangeChange}
        inputClassName="w-full p-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
      />
    ),
    [datepickerKey, dateRange]
  );

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
    setDateRange({
      startDate: DEFAULT_START_DATE,
      endDate: DEFAULT_END_DATE,
    });
    updateDatepickerKey();
    setEventDataList([...allEventsDataList]);
  }

  return (
    <div className="w-[360px] mr-2 2xl:mr-6 max-h-screen">
      <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg">
        <h2 className="text-lg text-center font-semibold mb-4">Filter Events</h2>
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
            Sort By
            <span className="cursor-pointer ml-auto" onClick={toggleShowSortBy}>
              {showSortBy ? <ChevronUpIcon className="h-6 w-6" /> : <ChevronDownIcon className="h-6 w-6" />}
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
                className="w-full p-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
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
                    className="mr-2 h-4 w-4 rounded border-gray-300 text-black focus:ring-1 focus:ring-black"
                    checked={eventStatusValue.includes("past")}
                    onChange={() => toggleStatusCheckboxValue("past")}
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
                    className="mr-2 h-4 w-4 rounded border-gray-300 text-black focus:ring-1 focus:ring-black"
                    checked={eventStatusValue.includes("future")}
                    onChange={() => toggleStatusCheckboxValue("future")}
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
                    className="mr-2 h-4 w-4 rounded border-gray-300 text-black focus:ring-1 focus:ring-black"
                    checked={eventTypeValue.includes("public")}
                    onChange={() => toggleTypeCheckboxValue("public")}
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
                    className="mr-2 h-4 w-4 rounded border-gray-300 text-black focus:ring-1 focus:ring-black"
                    checked={eventTypeValue.includes("private")}
                    onChange={() => toggleTypeCheckboxValue("private")}
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
                className="w-full p-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                value={minPriceValue !== null ? minPriceValue.toString() : ""}
                onChange={(e) => {
                  const newValue = parseFloat(e.target.value);
                  setMinPriceValue(isNaN(newValue) ? null : newValue);
                }}
              />
              <span className="text-gray-700 mx-2">to</span>
              <span className="text-gray-700 mr-2">$</span>
              <input
                type="text"
                id="maxPrice"
                name="maxPrice"
                placeholder="Max"
                className="w-full p-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                value={maxPriceValue !== null ? maxPriceValue.toString() : ""}
                onChange={(e) => {
                  const newValue = parseFloat(e.target.value);
                  setMaxPriceValue(isNaN(newValue) ? null : newValue);
                }}
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
          {showDateRange && <div className="flex justify-start items-center z-50">{DatepickerComponent}</div>}
        </div>
        <div className="mt-5 w-full flex items-center">
          <HighlightButton className="hover:bg-gray-300" onClick={handleClearAll}>
            Clear all
          </HighlightButton>
          <HighlightButton className="ml-auto hover:bg-gray-300" onClick={applyFilters}>
            Apply Filters!
          </HighlightButton>
        </div>
      </div>
    </div>
  );
}
