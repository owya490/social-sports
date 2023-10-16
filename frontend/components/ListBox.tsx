"use client";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { Fragment, useState } from "react";

const people = [
  { name: "Number of Guests", unavailable: true },
  { name: "1 Guest" },
  { name: "2 Guests" },
  { name: "3 Guests" },
  { name: "4 Guests" },
  { name: "5 Guests" },
  { name: "6 Guests" },
  { name: "7 Guests" },
  { name: "8 Guests" },
  { name: "9 Guests" },
  { name: "10 Guests" },
  { name: "11 Guests" },
  { name: "12 Guests" },
];

export default function ListBox() {
  const [selected, setSelected] = useState(people[0]);

  return (
    <div className="rounded-3xl p-[10%] mb-5 w-full">
      <Listbox value={selected} onChange={setSelected}>
        <div className="relative">
          <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
            <span className="block truncate text-md lg:text-lg">{selected.name}</span>
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
              {people.map((person, personIdx) => (
                <Listbox.Option
                  key={personIdx}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                      active ? "bg-amber-100 text-amber-900" : "text-gray-900"
                    }`
                  }
                  value={person}
                  hidden={person.unavailable}
                >
                  {({ selected }) => (
                    <>
                      <span>{person.name}</span>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}
