"use client";

import { Dialog, Transition } from "@headlessui/react";
import {
  AdjustmentsHorizontalIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Checkbox, Slider } from "@material-tailwind/react";
import { Fragment, useState } from "react";
import Datepicker from "react-tailwindcss-datepicker";
import ListBox from "./ListBox";
import { EventData } from "@/interfaces/EventTypes";
import {
  filterEventsByDate,
  filterEventsByMaxProximity,
  filterEventsByPrice,
} from "@/services/filterService";
import { Timestamp } from "firebase/firestore";
import { getLocationCoordinates } from "@/services/locationUtils";
const geofire = require("geofire-common");

const DAY_START_TIME_STRING = " 00:00:00";
const DAY_END_TIME_STRING = " 23:59:59";

type FilterDialogProps = {
  eventDataList: EventData[];
  allEventsDataList: EventData[];
  setEventDataList: React.Dispatch<React.SetStateAction<any>>;
};

export default function FilterDialog({
  eventDataList,
  allEventsDataList,
  setEventDataList,
}: FilterDialogProps) {
  let [isOpen, setIsOpen] = useState(false);
  const [priceFilterEnabled, setPriceFilterEnabled] = useState(false);
  const [dateFilterEnabled, setDateFilterEnabled] = useState(false);
  const [proximityFilterEnabled, setProximityFilterEnabled] = useState(false);
  const [eventDataListToFilter, setEventDataListToFilter] = useState([
    ...allEventsDataList,
  ]);
  const [maxPriceSliderValue, setMaxPriceSliderValue] = useState(25);
  const [dateRange, setDateRange] = useState<{
    startDate: string | null;
    endDate: string | null;
  }>({
    startDate: null,
    endDate: null,
  });
  const [maxProximitySliderValue, setMaxProximitySliderValue] =
    useState<number>(25); // max proximity in kms.

  const handleDateRangeChange = (dateRange: any) => {
    if (dateRange.startDate && dateRange.endDate) {
      let timestampDateRange = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      };

      setDateRange(timestampDateRange);
    }
  };

  function closeModal() {
    setIsOpen(false);
  }

  function openModal() {
    setIsOpen(true);
  }

  async function applyFilters() {
    let hasFiltered: boolean = false;
    setEventDataListToFilter([...allEventsDataList]);

    if (priceFilterEnabled) {
      const newEventDataList = filterEventsByPrice(
        [...eventDataListToFilter],
        null,
        maxPriceSliderValue
      );
      setEventDataList(newEventDataList);
      hasFiltered = true; // signify that we have filtered once
    }

    if (hasFiltered) {
      setEventDataListToFilter([...eventDataList]);
    }

    if (dateFilterEnabled && dateRange.startDate && dateRange.endDate) {
      const newEventDataList = filterEventsByDate(
        [...eventDataListToFilter],
        Timestamp.fromDate(
          new Date(dateRange.startDate + DAY_START_TIME_STRING)
        ), // TODO: needed to specify maximum time range on particular day.
        Timestamp.fromDate(new Date(dateRange.endDate + DAY_END_TIME_STRING))
      );
      setEventDataList(newEventDataList);
      hasFiltered = true;
    }

    if (proximityFilterEnabled && maxProximitySliderValue !== null) {
      const newEventDataList = filterEventsByMaxProximity(
        [...eventDataListToFilter],
        maxProximitySliderValue,
        -31.9523,
        115.8613
      );
      setEventDataList(newEventDataList);
      hasFiltered = true;
    }

    // TODO: add more filters

    if (!hasFiltered) {
      setEventDataList([...allEventsDataList]);
    }

    const { lat, lng } = await getLocationCoordinates("Sydney NSW Australia");
    console.log("lat", lat, lng);

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

      <Transition appear show={isOpen} as={Fragment}>
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
                        <p
                          className={
                            priceFilterEnabled
                              ? "text-lg font-bold"
                              : "text-lg font-bold text-gray-500"
                          }
                        >
                          Max Price
                        </p>
                        <Checkbox
                          checked={priceFilterEnabled}
                          className="h-4"
                          crossOrigin={undefined}
                          onChange={() => {
                            console.log(priceFilterEnabled);
                            setPriceFilterEnabled(!priceFilterEnabled);
                          }}
                        />
                      </div>
                      <div className="w-full mt-5 flex items-center">
                        <p
                          className={
                            priceFilterEnabled ? "mr-2" : "mr-2 opacity-50"
                          }
                        >
                          ${maxPriceSliderValue}
                        </p>
                        {priceFilterEnabled ? (
                          <Slider
                            color="blue"
                            className="h-1"
                            step={1}
                            min={0}
                            max={100}
                            value={maxPriceSliderValue}
                            onChange={(e) =>
                              setMaxPriceSliderValue(parseInt(e.target.value))
                            }
                          />
                        ) : (
                          <Slider
                            color="blue"
                            className="h-1 opacity-50"
                            step={1}
                            min={0}
                            value={maxPriceSliderValue}
                          />
                        )}
                      </div>
                    </div>
                    <div className="pb-5">
                      <div className="flex items-center">
                        <p
                          className={
                            dateFilterEnabled
                              ? "text-lg font-bold"
                              : "text-lg font-bold text-gray-500"
                          }
                        >
                          Date Range
                        </p>
                        <Checkbox
                          checked={dateFilterEnabled}
                          className="h-4"
                          crossOrigin={undefined}
                          onChange={() => {
                            console.log("price1", dateFilterEnabled);
                            setDateFilterEnabled(!dateFilterEnabled);
                          }}
                        />
                      </div>

                      <Datepicker
                        value={dateRange}
                        // useRange={false}
                        minDate={new Date()}
                        separator="to"
                        displayFormat={"DD/MM/YYYY"}
                        onChange={handleDateRangeChange}
                        inputClassName="border-1 border border-black p-2 rounded-lg w-full mt-2"
                        disabled={!dateFilterEnabled}
                      />
                    </div>
                    <div className="pb-5">
                      <div className="flex items-center">
                        <p
                          className={
                            proximityFilterEnabled
                              ? "text-lg font-bold"
                              : "text-lg font-bold text-gray-500"
                          }
                        >
                          Max Proximity
                        </p>
                        <Checkbox
                          checked={proximityFilterEnabled}
                          className="h-4"
                          crossOrigin={undefined}
                          onChange={() => {
                            setProximityFilterEnabled(!proximityFilterEnabled);
                          }}
                        />
                      </div>
                      <p
                        className={
                          proximityFilterEnabled ? "mr-2" : "mr-2 opacity-50"
                        }
                      >
                        {maxProximitySliderValue} km
                      </p>
                      {proximityFilterEnabled ? (
                        <Slider
                          color="blue"
                          className="h-1"
                          step={10}
                          min={0}
                          max={200}
                          value={maxProximitySliderValue}
                          onChange={(e) =>
                            setMaxProximitySliderValue(parseInt(e.target.value))
                          }
                        />
                      ) : (
                        <Slider
                          color="blue"
                          className="h-1 opacity-50"
                          step={50}
                          min={0}
                          value={maxProximitySliderValue}
                        />
                      )}
                    </div>
                  </div>

                  <div className="mt-5 w-full flex items-center">
                    <button
                      className="hover:underline cursor-pointer"
                      onClick={() => {
                        setMaxPriceSliderValue(25);
                        setDateRange({
                          startDate: null,
                          endDate: null,
                        });
                        setMaxProximitySliderValue(100);
                      }}
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
