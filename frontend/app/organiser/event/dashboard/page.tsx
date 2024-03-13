"use client";
import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/20/solid";

export default function Dashboard() {
  const [showSearch, setShowSearch] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [showEventStatus, setShowEventStatus] = useState(true);
  const [selectedEventStatus, setSelectedEventStatus] = useState<string[]>([]);
  const [showEventType, setShowEventType] = useState(true);
  const [selectedEventType, setSelectedEventType] = useState<string[]>([]);
  const [showPriceRange, setShowPriceRange] = useState(true);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [showDateRange, setShowDateRange] = useState(true);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

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

  const handleEventStatusChange = (value: string) => {
    const index = selectedEventStatus.indexOf(value);
    if (index === -1) {
      setSelectedEventStatus([...selectedEventStatus, value]);
    } else {
      const updatedEventStatus = [...selectedEventStatus];
      updatedEventStatus.splice(index, 1);
      setSelectedEventStatus(updatedEventStatus);
    }
  };
  const handleEventTypeChange = (value: string) => {
    const index = selectedEventType.indexOf(value);
    if (index === -1) {
      setSelectedEventType([...selectedEventType, value]);
    } else {
      const updatedEventType = [...selectedEventType];
      updatedEventType.splice(index, 1);
      setSelectedEventType(updatedEventType);
    }
  };

  const clearFilters = () => {
    setSearchValue("");
    setSelectedEventStatus([]);
    setSelectedEventType([]);
    setMinPrice("");
    setMaxPrice("");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="w-screen flex justify-center mt-16 ml-14">
      {/* <OrganiserNavbar /> */}
      <div className="w-screen mx-10">
        <div className="text-6xl my-12">Event Dashboard</div>
        <div className="flex flex-cols-3">
          <div className="col-start-1 col-span-1 max-w-sm">
            <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg">
              <h2 className="text-lg text-center font-semibold mb-4">Filter Events</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
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
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
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
                          checked={selectedEventStatus.includes("Past")}
                          onChange={() => handleEventStatusChange("Past")}
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
                          checked={selectedEventStatus.includes("Future")}
                          onChange={() => handleEventStatusChange("Future")}
                        />
                        Future
                      </label>
                    </div>
                  </div>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
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
                          checked={selectedEventType.includes("Public")}
                          onChange={() => handleEventTypeChange("Public")}
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
                          checked={selectedEventType.includes("Private")}
                          onChange={() => handleEventTypeChange("Private")}
                        />
                        Private
                      </label>
                    </div>
                  </div>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
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
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value.replace(/[^0-9.]/g, ""))}
                    />
                    <span className="text-gray-700 mx-4">to</span>
                    <span className="text-gray-700 mr-2">$</span>
                    <input
                      type="text"
                      id="maxPrice"
                      name="maxPrice"
                      placeholder="Max"
                      className="w-full p-2 border rounded-xl focus:outline-none focus:ring focus:border-blue-300"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value.replace(/[^0-9.]/g, ""))}
                    />
                  </div>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  Date Range
                  <span className="cursor-pointer ml-auto" onClick={toggleShowDateRange}>
                    {showDateRange ? <ChevronUpIcon className="h-6 w-6" /> : <ChevronDownIcon className="h-6 w-6" />}
                  </span>
                </label>
                {showDateRange && (
                  <div className="flex justify-start items-center">
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      className="w-full p-2 border rounded-xl focus:outline-none focus:ring focus:border-blue-300"
                      placeholder="Start Date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                    <span className="text-gray-700 mx-4">to</span>
                    <input
                      type="date"
                      id="endDate"
                      name="endDate"
                      className="w-full p-2 border rounded-xl focus:outline-none focus:ring focus:border-blue-300"
                      placeholder="End Date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                )}
              </div>
              <button
                className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring focus:border-blue-300"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            </div>
          </div>
          <div className="col-start-2 col-span-2">
            <div className="">lol</div>
          </div>
        </div>
      </div>
    </div>
  );
}
