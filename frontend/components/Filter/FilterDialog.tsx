"use client";

import { Dialog, Transition } from "@headlessui/react";
import { AdjustmentsHorizontalIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Slider } from "@material-tailwind/react";
import { Fragment } from "react";
import Datepicker from "react-tailwindcss-datepicker";
import ListBox from "../../components/ListBox";
import { EventData } from "@/interfaces/EventTypes";
import { NO_SPORT_CHOSEN_STRING } from "@/services/filterService";

export enum SortByCategory {
  HOT, // eslint-disable-line
  TOP_RATED, // eslint-disable-line
  PRICE_ASCENDING, // eslint-disable-line
  PRICE_DESCENDING, // eslint-disable-line
  DATE_ASCENDING, // eslint-disable-line
  DATE_DESCENDING, // eslint-disable-line
}
export const DEFAULT_SORT_BY_CATEGORY = SortByCategory.HOT;
export const HOT_SORTBY_STRING = "Hot";
export const TOP_RATED_SORTBY_STRING = "Top Rated";
export const PRICE_ASCENDING_SORTBY_STRING = "Price Ascending";
export const PRICE_DESCENDING_SORTBY_STRING = "Price Descending";
export const DATE_ASCENDING_SORTBY_STRING = "Date Ascending";
export const DATE_DESCENDING_SORTBY_STRING = "Date Descending";

export const DAY_START_TIME_STRING = " 00:00:00";
export const DAY_END_TIME_STRING = " 23:59:59";
export const DEFAULT_MAX_PRICE = 100;
export const DEFAULT_MAX_PROXIMITY = 50;
export const DEFAULT_START_DATE = null;
export const DEFAULT_END_DATE = null;
export const PROXIMITY_SLIDER_MAX_VALUE = 100;
export const PRICE_SLIDER_MAX_VALUE = 100;

export const VOLLEYBALL_SPORT_STRING = "Volleyball";
export const BADMINTON_SPORT_STRING = "Badminton";
export const BASKETBALL_SPORT_STRING = "Basketball";
export const SOCCER_SPORT_STRING = "Soccer";
export const TENNIS_SPORT_STRING = "Tennis";
export const TABLE_TENNIS_SPORT_STRING = "Table Tennis";
export const OZTAG_SPORT_STRING = "Oztag";
export const BASEBALL_SPORT_STRING = "Baseball";

export const EMPTY_LOCATION_STRING = "";

interface FilterDialogProps {
  eventDataList: EventData[];
  setEventDataList: React.Dispatch<React.SetStateAction<any>>;
  sortByCategoryValue: SortByCategory;
  setSortByCategoryValue: React.Dispatch<React.SetStateAction<SortByCategory>>;
  appliedSortByCategoryValue: SortByCategory;
  setAppliedSortByCategoryValue: React.Dispatch<React.SetStateAction<SortByCategory>>;
  maxPriceSliderValue: number;
  setMaxPriceSliderValue: React.Dispatch<React.SetStateAction<number>>;
  appliedMaxPriceSliderValue: number;
  setAppliedMaxPriceSliderValue: React.Dispatch<React.SetStateAction<number>>;
  maxProximitySliderValue: number;
  setMaxProximitySliderValue: React.Dispatch<React.SetStateAction<number>>;
  appliedMaxProximitySliderValue: number;
  setAppliedMaxProximitySliderValue: React.Dispatch<React.SetStateAction<number>>;
  dateRange: {
    startDate: string | null;
    endDate: string | null;
  };
  setDateRange: React.Dispatch<
    React.SetStateAction<{
      startDate: string | null;
      endDate: string | null;
    }>
  >;
  appliedDateRange: {
    startDate: string | null;
    endDate: string | null;
  };
  setAppliedDateRange: React.Dispatch<
    React.SetStateAction<{
      startDate: string | null;
      endDate: string | null;
    }>
  >;
  srcLocation: string;
  setSrcLocation: React.Dispatch<React.SetStateAction<string>>;
  selectedSport: string;
  setSelectedSport: React.Dispatch<React.SetStateAction<string>>;
  applyFilters: () => Promise<void>;
  isFilterModalOpen: boolean;
  setIsFilterModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  closeModal: () => void;
}

export default function FilterDialog({
  eventDataList,
  setEventDataList,
  sortByCategoryValue,
  setSortByCategoryValue,
  appliedSortByCategoryValue,
  setAppliedSortByCategoryValue,
  maxPriceSliderValue,
  setMaxPriceSliderValue,
  appliedMaxPriceSliderValue,
  setAppliedMaxPriceSliderValue,
  maxProximitySliderValue,
  setMaxProximitySliderValue,
  appliedMaxProximitySliderValue,
  setAppliedMaxProximitySliderValue,
  dateRange,
  setDateRange,
  appliedDateRange,
  setAppliedDateRange,
  srcLocation,
  setSrcLocation,
  selectedSport,
  setSelectedSport,
  applyFilters,
  isFilterModalOpen,
  setIsFilterModalOpen,
  closeModal,
}: FilterDialogProps) {
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

  function openModal() {
    setMaxPriceSliderValue(appliedMaxPriceSliderValue);
    setMaxProximitySliderValue(appliedMaxProximitySliderValue);
    setDateRange(appliedDateRange);
    setSortByCategoryValue(appliedSortByCategoryValue);
    setIsFilterModalOpen(true);
  }

  function handleClearAll() {
    setMaxPriceSliderValue(DEFAULT_MAX_PRICE);
    setAppliedMaxPriceSliderValue(DEFAULT_MAX_PRICE);

    setDateRange({
      startDate: DEFAULT_START_DATE,
      endDate: DEFAULT_END_DATE,
    });
    setAppliedDateRange({
      startDate: DEFAULT_START_DATE,
      endDate: DEFAULT_END_DATE,
    });

    setMaxProximitySliderValue(DEFAULT_MAX_PROXIMITY);
    setAppliedMaxProximitySliderValue(DEFAULT_MAX_PROXIMITY);

    setSortByCategoryValue(DEFAULT_SORT_BY_CATEGORY);
    setAppliedSortByCategoryValue(DEFAULT_SORT_BY_CATEGORY);

    setSelectedSport(NO_SPORT_CHOSEN_STRING);

    setEventDataList([...eventDataList]);
    setSrcLocation(EMPTY_LOCATION_STRING);
    closeModal();
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="text-black flex items-center border border-black px-1 md:px-3 rounded-lg h-10 ml-auto"
      >
        <p className="hidden md:block">Filters</p>
        <AdjustmentsHorizontalIcon className="w-7 ml-1" />
      </button>

      <Transition appear show={isFilterModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform rounded-2xl p-6 bg-white text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-2xl font-medium leading-6 text-gray-900 pb-3 border-b-[1px] border-gray-500 w-full text-center flex justify-center items-center"
                  >
                    Filters
                    <button className="absolute right-8" onClick={closeModal}>
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </Dialog.Title>
                  <div className="mt-5 space-y-5">
                    <div className="border-b-[1px] border-gray-300 pb-5">
                      <h4 className="text-lg font-bold">Sort By</h4>
                      <div className="mt-2">
                        <ListBox
                          onChangeHandler={function (e: any): void {
                            //   throw new Error("Function not implemented.");
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
                      </div>
                    </div>
                    <div className="border-b-[1px] border-gray-300 pb-5">
                      <div className="flex items-center">
                        <p className={"text-lg font-bold"}>Max Price</p>
                      </div>
                      <div className="w-full mt-3 flex items-center">
                        <p className={"mr-2"}>
                          {maxPriceSliderValue === PRICE_SLIDER_MAX_VALUE ? "$ANY" : "$" + maxPriceSliderValue}
                        </p>

                        <Slider
                          color="blue"
                          className="h-1 z-0"
                          step={1}
                          min={0}
                          max={PRICE_SLIDER_MAX_VALUE}
                          defaultValue={maxPriceSliderValue === 0 ? 0 : maxPriceSliderValue}
                          onChange={(e) => {
                            setMaxPriceSliderValue(parseInt(e.target.value));
                          }}
                        />
                      </div>
                    </div>
                    <div className="border-b-[1px] border-gray-300 pb-5">
                      <div className="flex items-center">
                        <p className={"text-lg font-bold"}>Date Range</p>
                      </div>

                      <Datepicker
                        value={dateRange}
                        minDate={new Date()}
                        separator="to"
                        displayFormat={"DD/MM/YYYY"}
                        onChange={handleDateRangeChange}
                        inputClassName="border-1 border border-black p-2 rounded-lg w-full mt-2 z-10"
                      />
                    </div>
                    <div className="border-b-[1px] border-gray-300 pb-5">
                      <div className="flex items-center">
                        <p className={"text-lg font-bold"}>Max Proximity</p>
                      </div>
                      <div className="w-full mt-3 mb-5 flex items-center">
                        <p className="mr-2 whitespace-nowrap">
                          {maxProximitySliderValue === PROXIMITY_SLIDER_MAX_VALUE
                            ? "ANY km"
                            : maxProximitySliderValue + "km"}
                        </p>
                        <Slider
                          color="blue"
                          className="h-1 z-0"
                          step={1}
                          min={0}
                          max={PROXIMITY_SLIDER_MAX_VALUE}
                          defaultValue={maxProximitySliderValue === 0 ? 0 : maxProximitySliderValue}
                          onChange={(e) => {
                            setMaxProximitySliderValue(parseInt(e.target.value));
                          }}
                        />
                      </div>
                      {/* <Input
                        shrink={false}
                        variant="outlined"
                        label="Search Location"
                        crossOrigin="true"
                        value={srcLocation}
                        onChange={({ target }) => setSrcLocation(target.value)}
                      /> */}
                    </div>
                  </div>

                  <div className="mt-3 w-full flex items-center">
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
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
