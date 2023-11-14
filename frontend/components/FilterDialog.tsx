import { Dialog, Transition } from "@headlessui/react";
import { Checkbox, Slider } from "@material-tailwind/react";
import { Fragment, useState } from "react";
import Datepicker from "react-tailwindcss-datepicker";
import ListBox from "./ListBox";

export default function MyModal() {
  let [isOpen, setIsOpen] = useState(false);

  function closeModal() {
    setIsOpen(false);
  }

  function openModal() {
    setIsOpen(true);
  }

  const [maxSliderValue, setMaxSliderValue] = useState(25);

  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  });

  const handleDateRangeChange = (dateRange: any) => {
    setDateRange(dateRange);
  };

  const [priceFilterEnabled, setPriceFilterEnabled] = useState(false);
  const [dateFilterEnabled, setDateFilterEnabled] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="border-1 border-black border py-1 px-2 rounded-lg"
      >
        Filters
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
                    className="text-2xl font-medium leading-6 text-gray-900 pb-3 border-b-[1px] border-gray-500 w-full text-center"
                  >
                    Filters
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
                        <p className="text-lg font-bold">Max Price</p>
                        <Checkbox
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
                          ${maxSliderValue}
                        </p>
                        {priceFilterEnabled ? (
                          <Slider
                            color="blue"
                            className="h-1"
                            step={1}
                            min={0}
                            max={100}
                            value={maxSliderValue}
                            onChange={(e) =>
                              setMaxSliderValue(parseInt(e.target.value))
                            }
                          />
                        ) : (
                          <Slider
                            color="blue"
                            className="h-1 opacity-50"
                            step={1}
                            min={0}
                            value={maxSliderValue}
                          />
                        )}
                      </div>
                    </div>
                    <div className="pb-5">
                      <div className="flex items-center">
                        <p className="text-lg font-bold">Date Range</p>
                        <Checkbox
                          className="h-4"
                          crossOrigin={undefined}
                          onChange={() =>
                            setDateFilterEnabled(!dateFilterEnabled)
                          }
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
                  </div>

                  <div className="mt-5 w-full flex items-center">
                    <button
                      className="hover:underline cursor-pointer"
                      onClick={() => {
                        setMaxSliderValue(25);
                        setPriceFilterEnabled(false);
                        setDateRange({
                          startDate: null,
                          endDate: null,
                        });
                        setDateFilterEnabled(false);
                      }}
                    >
                      Clear all
                    </button>
                    <button
                      type="button"
                      className="ml-auto inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={closeModal}
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
