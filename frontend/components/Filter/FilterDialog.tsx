"use client";

import { EventData } from "@/interfaces/EventTypes";
import { NO_SPORT_CHOSEN_STRING } from "@/services/src/filterService";
import { Dialog, Transition } from "@headlessui/react";
import { AdjustmentsHorizontalIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Slider } from "@material-tailwind/react";
import { Fragment } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import ListBox from "../../components/ListBox";
import { InvertedHighlightButton } from "../elements/HighlightButton";

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

export const DAY_START_TIME_STRING = " 00:00:00";
export const DAY_END_TIME_STRING = " 23:59:59";
export const DEFAULT_MAX_PRICE = 100;
export const DEFAULT_MAX_PROXIMITY = 50;
export const DEFAULT_DATE_RANGE = {
  from: undefined as Date | undefined,
  to: undefined as Date | undefined,
};
export const PROXIMITY_SLIDER_MAX_VALUE = 100;
export const PRICE_SLIDER_MAX_VALUE = 100;

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
    from: Date | undefined;
    to: Date | undefined;
  };
  setDateRange: React.Dispatch<
    React.SetStateAction<{
      from: Date | undefined;
      to: Date | undefined;
    }>
  >;
  appliedDateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  setAppliedDateRange: React.Dispatch<
    React.SetStateAction<{
      from: Date | undefined;
      to: Date | undefined;
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
  setSelectedSport,
  applyFilters,
  isFilterModalOpen,
  setIsFilterModalOpen,
  closeModal,
}: FilterDialogProps) {
  const handleDateRangeChange = (dateRange: any) => {
    if (dateRange) {
      setDateRange(dateRange);
    } else {
      setDateRange(DEFAULT_DATE_RANGE);
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

    setDateRange(DEFAULT_DATE_RANGE);
    setAppliedDateRange(DEFAULT_DATE_RANGE);

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
      <InvertedHighlightButton onClick={openModal} className="!flex !items-center px-1 !md:px-3 !h-10 !ml-auto">
        <p className="hidden md:block">Filters</p>
        <AdjustmentsHorizontalIcon className="w-7 md:ml-1" />
      </InvertedHighlightButton>

      <Transition appear show={isFilterModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-[60]" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25 z-[60]" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto z-[60]">
            <div className="flex min-h-full items-center justify-center p-2 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-lg mx-4 md:mx-0 transform rounded-2xl p-6 md:p-6 bg-white text-left align-middle shadow-xl transition-all z-[60]">
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
                          color="gray"
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

                      <div className="flex justify-center w-full">
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
                          className="mt-2 scale-90"
                          styles={{
                            root: { fontSize: "0.875rem" },
                          }}
                        />
                      </div>
                      {dateRange?.from && (
                        <p className="text-sm text-gray-600 mt-2">
                          Selected: {dateRange.from.toLocaleDateString()}
                          {dateRange.to && ` - ${dateRange.to.toLocaleDateString()}`}
                        </p>
                      )}
                    </div>
                    <div className="border-b-[1px] border-gray-300 pb-5">
                      <div className="flex items-center">
                        <p className="text-lg">
                          <span className="font-bold">Max Proximity</span>
                          <span className="italic">
                            {srcLocation === "" ? " - No location specified" : " to " + srcLocation}
                          </span>
                        </p>
                      </div>
                      <div className="w-full mt-3 mb-5 flex items-center">
                        <p className="mr-2 whitespace-nowrap">
                          {maxProximitySliderValue === PROXIMITY_SLIDER_MAX_VALUE
                            ? "ANY km"
                            : maxProximitySliderValue + "km"}
                        </p>
                        <Slider
                          color="gray"
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
                      className="ml-auto inline-flex justify-center rounded-md bg-black px-4 py-2 font-semibold text-white border-[1px] border-black hover:bg-white hover:text-black focus-visible:ring-offset-2 transition-colors duration-300 transform"
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
