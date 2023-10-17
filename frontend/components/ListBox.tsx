"use client";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { Fragment, useEffect, useState } from "react";

const guests = 7;
const people = [
  { name: "1 Guest", hidden: guests < 1 },
  { name: "2 Guests", hidden: guests < 2 },
  { name: "3 Guests", hidden: guests < 3 },
  { name: "4 Guests", hidden: guests < 4 },
  { name: "5 Guests", hidden: guests < 5 },
  { name: "6 Guests", hidden: guests < 6 },
  { name: "7 Guests", hidden: guests < 7 },
  { name: "8 Guests", hidden: guests < 8 },
  { name: "9 Guests", hidden: guests < 9 },
  { name: "10 Guests", hidden: guests < 10 },
  { name: "11 Guests", hidden: guests < 11 },
  { name: "12 Guests", hidden: guests < 12 },
  { name: "13 Guests", hidden: guests < 13 },
  { name: "14 Guests", hidden: guests < 14 },
  { name: "15 Guests", hidden: guests < 15 },
  { name: "16 Guests", hidden: guests < 16 },
  { name: "17 Guests", hidden: guests < 17 },
  { name: "18 Guests", hidden: guests < 18 },
  { name: "19 Guests", hidden: guests < 19 },
  { name: "20 Guests", hidden: guests < 20 },
  { name: "21 Guests", hidden: guests < 21 },
  { name: "22 Guests", hidden: guests < 22 },
  { name: "23 Guests", hidden: guests < 23 },
  { name: "24 Guests", hidden: guests < 24 },
  { name: "25 Guests", hidden: guests < 25 },
  { name: "26 Guests", hidden: guests < 26 },
  { name: "27 Guests", hidden: guests < 27 },
  { name: "28 Guests", hidden: guests < 28 },
  { name: "29 Guests", hidden: guests < 29 },
  { name: "30 Guests", hidden: guests < 30 },
  { name: "31 Guests", hidden: guests < 31 },
  { name: "32 Guests", hidden: guests < 32 },
  { name: "33 Guests", hidden: guests < 33 },
  { name: "34 Guests", hidden: guests < 34 },
  { name: "35 Guests", hidden: guests < 35 },
  { name: "36 Guests", hidden: guests < 36 },
  { name: "37 Guests", hidden: guests < 37 },
  { name: "38 Guests", hidden: guests < 38 },
  { name: "39 Guests", hidden: guests < 39 },
  { name: "40 Guests", hidden: guests < 40 },
  { name: "41 Guests", hidden: guests < 41 },
  { name: "42 Guests", hidden: guests < 42 },
  { name: "43 Guests", hidden: guests < 43 },
  { name: "44 Guests", hidden: guests < 44 },
  { name: "45 Guests", hidden: guests < 45 },
  { name: "46 Guests", hidden: guests < 46 },
  { name: "47 Guests", hidden: guests < 47 },
  { name: "48 Guests", hidden: guests < 48 },
  { name: "49 Guests", hidden: guests < 49 },
  { name: "50 Guests", hidden: guests < 50 },
  { name: "51 Guests", hidden: guests < 51 },
  { name: "52 Guests", hidden: guests < 52 },
  { name: "53 Guests", hidden: guests < 53 },
  { name: "54 Guests", hidden: guests < 54 },
  { name: "55 Guests", hidden: guests < 55 },
  { name: "56 Guests", hidden: guests < 56 },
  { name: "57 Guests", hidden: guests < 57 },
  { name: "58 Guests", hidden: guests < 58 },
  { name: "59 Guests", hidden: guests < 59 },
];

export default function ListBox({
  onGuestCountChange,
}: {
  onGuestCountChange: (count: string) => void;
}) {
  const [selected, setSelected] = useState(people[0]);

  useEffect(() => {
    if (onGuestCountChange && typeof onGuestCountChange === "function") {
      onGuestCountChange(selected.name);
    }
  }, [selected, onGuestCountChange]);

  return (
    <div className="rounded-3xl p-[9%] mb-5 w-full">
      <Listbox value={selected} onChange={setSelected}>
        <div className="relative">
          <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
            <span className="block truncate text-md lg:text-lg">
              {selected.name}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-tops pr-2">
              <ChevronUpDownIcon
                className="h-7 w-7 text-gray-400 mt-1 lg:mt-2"
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute max-h-[160px] md:max-h-[200px] 2xl:max-h-[210px] w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              {people.map(
                (person, personIdx) =>
                  !person.hidden && (
                    <Listbox.Option
                      key={personIdx}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                          active
                            ? "bg-amber-100 text-amber-900"
                            : "text-gray-900"
                        }`
                      }
                      value={person}
                    >
                      {({ selected }) => (
                        <>
                          <span>{person.name}</span>
                          {selected ? (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                              <CheckIcon
                                className="h-5 w-5"
                                aria-hidden="true"
                              />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Listbox.Option>
                  )
              )}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}