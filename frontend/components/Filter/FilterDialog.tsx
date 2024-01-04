"use client";

import { Dialog, Transition } from "@headlessui/react";
import {
  AdjustmentsHorizontalIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Checkbox, Slider, Input } from "@material-tailwind/react";
import { Fragment, useState } from "react";
import Datepicker from "react-tailwindcss-datepicker";
import ListBox from "../../components/ListBox";
import { EventData } from "@/interfaces/EventTypes";
import {
  filterEventsByDate,
  filterEventsByMaxProximity,
  filterEventsByPrice,
} from "@/services/filterService";
import { Timestamp } from "firebase/firestore";
import {
  SYDNEY_LAT,
  SYDNEY_LNG,
  getLocationCoordinates,
} from "@/services/locationUtils";
import { set } from "firebase/database";

const DAY_START_TIME_STRING = " 00:00:00";
const DAY_END_TIME_STRING = " 23:59:59";
const PRICE_SLIDER_MAX_VALUE = 100;
const PROXIMITY_SLIDER_MAX_VALUE = 100;
const DEFAULT_MAX_PRICE = PRICE_SLIDER_MAX_VALUE;
const DEFAULT_MAX_PROXIMITY = PROXIMITY_SLIDER_MAX_VALUE;
const DEFAULT_START_DATE = null;
const DEFAULT_END_DATE = null;

interface FilterDialogProps {
  eventDataList: EventData[];
  allEventsDataList: EventData[];
  setEventDataList: React.Dispatch<React.SetStateAction<any>>;
}

export default function FilterDialog({
  eventDataList,
  allEventsDataList,
  setEventDataList,
}: FilterDialogProps) {
  let [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [maxPriceSliderValue, setMaxPriceSliderValue] =
    useState(DEFAULT_MAX_PRICE);
  const [dateRange, setDateRange] = useState<{
    startDate: string | null;
    endDate: string | null;
  }>({
    startDate: DEFAULT_START_DATE,
    endDate: DEFAULT_END_DATE,
  });
  const [maxProximitySliderValue, setMaxProximitySliderValue] =
    useState<number>(DEFAULT_MAX_PROXIMITY); // max proximity in kms.

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
  const [srcLocation, setSrcLocation] = useState<string>("");

  function closeModal() {
    setIsFilterModalOpen(false);
  }

  function openModal() {
    setIsFilterModalOpen(true);
  }

  async function applyFilters() {
    const isAnyPriceBool = maxPriceSliderValue === PRICE_SLIDER_MAX_VALUE;
    const isAnyProximityBool =
      maxProximitySliderValue === PROXIMITY_SLIDER_MAX_VALUE;

    let filteredEventDataList = [...allEventsDataList];

    // Filter by MAX PRICE
    if (!isAnyPriceBool) {
      let newEventDataList = filterEventsByPrice(
        [...filteredEventDataList],
        null,
        maxPriceSliderValue
      );
      filteredEventDataList = newEventDataList;
    }

    // Filter by DATERANGE
    if (dateRange.startDate && dateRange.endDate) {
      let newEventDataList = filterEventsByDate(
        [...filteredEventDataList],
        Timestamp.fromDate(
          new Date(dateRange.startDate + DAY_START_TIME_STRING)
        ), // TODO: needed to specify maximum time range on particular day.
        Timestamp.fromDate(new Date(dateRange.endDate + DAY_END_TIME_STRING))
      );
      filteredEventDataList = newEventDataList;
    }

    // Filter by MAX PROXIMITY
    if (!isAnyProximityBool) {
      let srcLat = SYDNEY_LAT;
      let srcLng = SYDNEY_LNG;
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

    // TODO: add more filters

    setEventDataList([...filteredEventDataList]);

    closeModal();
  }

  function handleClearAll() {
    setMaxPriceSliderValue(DEFAULT_MAX_PRICE);
    setDateRange({
      startDate: DEFAULT_START_DATE,
      endDate: DEFAULT_END_DATE,
    });
    setMaxProximitySliderValue(DEFAULT_MAX_PROXIMITY);
    setEventDataList([...allEventsDataList]);
    setSrcLocation("");
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
                      <ListBox
                        onChangeHandler={function (e: any): void {
                          //   throw new Error("Function not implemented.");
                        }}
                        options={[
                          { name: "Hot", value: "1" },
                          { name: "Top Rated", value: "1" },
                          { name: "Price Ascending", value: "1" },
                          { name: "Price Descending", value: "1" },
                          { name: "Date Ascending", value: "1" },
                          { name: "Date Descending", value: "1" },
                        ]}
                      />
                    </div>
                    <div className="border-b-[1px] border-gray-300 pb-5">
                      <div className="flex items-center">
                        <p className={"text-lg font-bold"}>Max Price</p>
                      </div>
                      <div className="w-full mt-3 flex items-center">
                        <p className={"mr-2"}>
                          $
                          {maxPriceSliderValue === PRICE_SLIDER_MAX_VALUE
                            ? "ANY"
                            : maxPriceSliderValue}
                        </p>

                        <Slider
                          color="blue"
                          className="h-1"
                          step={1}
                          min={0}
                          max={PRICE_SLIDER_MAX_VALUE}
                          defaultValue={
                            maxPriceSliderValue === 0 ? 0 : maxPriceSliderValue
                          }
                          value={
                            maxPriceSliderValue === 0 ? 0 : maxPriceSliderValue
                          }
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
                        <p className={"mr-2"}>
                          {maxProximitySliderValue ===
                          PROXIMITY_SLIDER_MAX_VALUE
                            ? "ANY Distance"
                            : maxProximitySliderValue + "km"}
                        </p>
                        <Slider
                          color="blue"
                          className="h-1 z-0"
                          step={1}
                          min={0}
                          max={PROXIMITY_SLIDER_MAX_VALUE}
                          defaultValue={
                            maxProximitySliderValue === 0
                              ? 0
                              : maxProximitySliderValue
                          }
                          value={
                            maxProximitySliderValue === 0
                              ? 0
                              : maxProximitySliderValue
                          }
                          onChange={(e) => {
                            setMaxProximitySliderValue(
                              parseInt(e.target.value)
                            );
                          }}
                        />
                      </div>
                      <Input
                        shrink={false}
                        variant="outlined"
                        label="Search Location"
                        placeholder="Sydney NSW Australia"
                        crossOrigin="true"
                        value={srcLocation}
                        onChange={({ target }) => setSrcLocation(target.value)}
                      />
                    </div>
                  </div>

                  <div className="mt-3 w-full flex items-center">
                    <button
                      className="hover:underline cursor-pointer"
                      onClick={handleClearAll}
                    >
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
