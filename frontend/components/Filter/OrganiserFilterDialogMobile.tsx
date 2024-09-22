"use client";

import { EventData } from "@/interfaces/EventTypes";
import { Dialog, Transition } from "@headlessui/react";
import { AdjustmentsHorizontalIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Fragment, useMemo, useState } from "react";
import Datepicker from "react-tailwindcss-datepicker";
import { InvertedHighlightButton } from "../elements/HighlightButton";
import ListBox from "../ListBox";
import {
  DATE_ASCENDING_SORTBY_STRING,
  DATE_DESCENDING_SORTBY_STRING,
  DEFAULT_END_DATE,
  DEFAULT_EVENT_STATUS,
  DEFAULT_SEARCH,
  DEFAULT_SORT_BY_CATEGORY,
  DEFAULT_START_DATE,
  HOT_SORTBY_STRING,
  PRICE_ASCENDING_SORTBY_STRING,
  PRICE_DESCENDING_SORTBY_STRING,
  TOP_RATED_SORTBY_STRING,
} from "./OrganiserFilterDialog";

export enum SortByCategory {
  HOT,
  TOP_RATED,
  PRICE_ASCENDING,
  PRICE_DESCENDING,
  DATE_ASCENDING,
  DATE_DESCENDING,
}

interface OrganiserFilterDialogMobileProps {
  eventDataList: EventData[];
  allEventsDataList: EventData[];
  setEventDataList: React.Dispatch<React.SetStateAction<any>>;

  sortByCategoryValue: SortByCategory;
  setSortByCategoryValue: React.Dispatch<React.SetStateAction<SortByCategory>>;
  appliedSortByCategoryValue: SortByCategory;
  setAppliedSortByCategoryValue: React.Dispatch<React.SetStateAction<SortByCategory>>;

  searchValue: string;
  setSearchValue: React.Dispatch<React.SetStateAction<string>>;
  appliedSearchValue: string;
  setAppliedSearchValue: React.Dispatch<React.SetStateAction<string>>;

  eventStatusValue: string;
  setEventStatusValue: React.Dispatch<React.SetStateAction<string>>;
  appliedEventStatusValue: string;
  setAppliedEventStatusValue: React.Dispatch<React.SetStateAction<string>>;

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
  isFilterModalOpen: boolean;
  setIsFilterModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  closeModal: () => void;
}

export default function OrganiserFilterDialogMobile({
  eventDataList,
  allEventsDataList,
  setEventDataList,
  sortByCategoryValue,
  setSortByCategoryValue,
  appliedSortByCategoryValue,
  setAppliedSortByCategoryValue,
  searchValue,
  setSearchValue,
  appliedSearchValue,
  setAppliedSearchValue,
  eventStatusValue,
  setEventStatusValue,
  appliedEventStatusValue,
  setAppliedEventStatusValue,
  dateRange,
  setDateRange,
  appliedDateRange,
  setAppliedDateRange,
  applyFilters,
  isFilterModalOpen,
  setIsFilterModalOpen,
  closeModal,
}: OrganiserFilterDialogMobileProps) {
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
        value={dateRange}
        separator="to"
        displayFormat={"DD/MM/YYYY"}
        onChange={handleDateRangeChange}
        inputClassName="w-full p-2 border rounded-xl focus:outline-none focus:ring focus:border-blue-300"
      />
    ),
    [datepickerKey, dateRange]
  );

  const toggleStatusCheckboxValue = (value: string) => {
    if (eventStatusValue === value) {
      setEventStatusValue("");
    } else {
      setEventStatusValue(value);
    }
  };

  function openModal() {
    setSortByCategoryValue(appliedSortByCategoryValue);
    setSearchValue(appliedSearchValue);
    setEventStatusValue(appliedEventStatusValue);
    setDateRange(appliedDateRange);
    setIsFilterModalOpen(true);
  }

  function handleClearAll() {
    setSortByCategoryValue(DEFAULT_SORT_BY_CATEGORY);
    setAppliedSortByCategoryValue(DEFAULT_SORT_BY_CATEGORY);
    updateSortByKey();
    setSearchValue(DEFAULT_SEARCH);
    setAppliedSearchValue(DEFAULT_SEARCH);
    setEventStatusValue(DEFAULT_EVENT_STATUS);
    setAppliedEventStatusValue(DEFAULT_EVENT_STATUS);
    setDateRange({
      startDate: DEFAULT_START_DATE,
      endDate: DEFAULT_END_DATE,
    });
    setAppliedDateRange({
      startDate: DEFAULT_START_DATE,
      endDate: DEFAULT_END_DATE,
    });
    updateDatepickerKey();
    setEventDataList([...allEventsDataList]);
    closeModal();
  }

  return (
    <>
      <InvertedHighlightButton onClick={openModal} className="!flex !items-center px-1 !md:px-3 !h-10 !ml-auto">
        <AdjustmentsHorizontalIcon className="w-7 md:ml-1" />
      </InvertedHighlightButton>

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
                    Filter Events
                    <button className="absolute right-8" onClick={closeModal}>
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </Dialog.Title>
                  <div className="mt-5 space-y-5">
                    <div className="border-b-[1px] border-gray-300 pb-5">
                      <h4 className="text-lg font-bold">Sort By</h4>
                      <div className="mt-2">
                        <ListBox
                          key={sortByKey}
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
                        <p className={"text-lg font-bold"}>Search</p>
                      </div>
                      <input
                        type="text"
                        id="search"
                        name="search"
                        className="w-full p-2 border-1 border border-black rounded-lg "
                        placeholder="Search for anything"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                      />
                    </div>
                    <div className="border-b-[1px] border-gray-300 pb-5">
                      <div className="flex items-center">
                        <p className="text-lg font-bold">Event Status</p>
                      </div>
                      <div className="flex mb-2 mt-1">
                        <label className="inline-flex items-center mr-auto">
                          <input
                            type="checkbox"
                            name="Past"
                            value="Past"
                            className="mr-2"
                            checked={eventStatusValue.includes("past")}
                            onChange={() => toggleStatusCheckboxValue("past")}
                          />
                          Past
                        </label>
                        <label className="inline-flex items-center mx-auto">
                          <input
                            type="checkbox"
                            name="Future"
                            value="Future"
                            className="mr-2"
                            checked={eventStatusValue.includes("future")}
                            onChange={() => toggleStatusCheckboxValue("future")}
                          />
                          Future
                        </label>
                      </div>
                    </div>
                    <div className="border-b-[1px] border-gray-300 pb-5">
                      <div className="flex items-center">
                        <p className={"text-lg font-bold"}>Date Range</p>
                      </div>
                      {DatepickerComponent}
                    </div>
                  </div>
                  <div className="mt-3 w-full flex items-center">
                    <button className="hover:underline cursor-pointer" onClick={handleClearAll}>
                      Clear all
                    </button>
                    <button
                      type="button"
                      className="ml-auto inline-flex justify-center rounded-md bg-highlight-yellow  px-4 py-2 font-semibold text-white border-2 border-highlight-yellow hover:bg-white hover:text-highlight-yellow focus-visible:ring-offset-2 transition-colors duration-300 transform"
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
