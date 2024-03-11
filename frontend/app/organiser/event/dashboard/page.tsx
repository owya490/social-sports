"use client";
import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/20/solid";

export default function Dashboard() {
  const [showEventDate, setShowEventDate] = useState(false);
  const [selectedEventDate, setSelectedEventDate] = useState<string[]>([]);

  const toggleShowEventDate = () => {
    setShowEventDate(!showEventDate);
  };

  const handleEventDateChange = (value: string) => {
    const index = selectedEventDate.indexOf(value);
    if (index === -1) {
      setSelectedEventDate([...selectedEventDate, value]);
    } else {
      const updatedEventDate = [...selectedEventDate];
      updatedEventDate.splice(index, 1);
      setSelectedEventDate(updatedEventDate);
    }
  };

  return (
    <div className="w-screen flex justify-center mt-24">
      <div className="w-screen mx-10 sm:mx-0 sm:w-[400px] md:w-[700px] lg:w-[1000px] xl:w-[1000px] 3xl:w-[1400px]">
        <div className="text-5xl my-4">Event Dashboard</div>
        <div className="flex flex-cols-3">
          <div className="col-start-1 col-span-1">
            <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg">
              <h2 className="text-lg text-center font-semibold mb-4">Filter Events</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Date
                  <span className="cursor-pointer ml-2" onClick={toggleShowEventDate}>
                    {showEventDate ? (
                      <ChevronDownIcon className="h-6 w-6 flex justify-right" />
                    ) : (
                      <ChevronUpIcon className="h-6 w-6" />
                    )}
                  </span>
                </label>
                {showEventDate && (
                  <div>
                    <div className="mb-2">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          name="Past"
                          value="Past"
                          className="mr-2"
                          checked={selectedEventDate.includes("Past")}
                          onChange={() => handleEventDateChange("Past")}
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
                          checked={selectedEventDate.includes("Future")}
                          onChange={() => handleEventDateChange("Future")}
                        />
                        Future
                      </label>
                    </div>
                  </div>
                )}
              </div>
              <div className="mb-4">
                <label htmlFor="priceRange" className="block text-sm font-medium text-gray-700 mb-1">
                  Price Range:
                </label>
                <input
                  type="range"
                  id="priceRange"
                  name="priceRange"
                  min="0"
                  max="1000"
                  step="10"
                  className="w-full focus:outline-none focus:ring focus:border-blue-300"
                />
                <div className="flex justify-between">
                  <span>$0</span>
                  <span>$1000</span>
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
                  Brand:
                </label>
                <input
                  type="text"
                  id="brand"
                  name="brand"
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
                  placeholder="Enter brand"
                />
              </div>

              <button className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring focus:border-blue-300">
                Apply Filters
              </button>
            </div>
          </div>
          <div className="col-start-2 col-span-2">hi2</div>
        </div>
      </div>
    </div>
  );
}
