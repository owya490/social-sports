"use client";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { Fragment, useEffect, useState } from "react";

export default function ListBox({
  onGuestCountChange,
  space,
}: {
  onGuestCountChange: (count: string) => void;
  space: number;
}) {
  const guests = 7;
  const people = [];

  for (let i = 1; i <= guests; i++) {
    people.push({ name: i, hidden: (guests < i || space < i )});
  }

  const [selected, setSelected] = useState(people[0]);

  useEffect(() => {
    if (onGuestCountChange && typeof onGuestCountChange === "function") {
      const guestLabel = selected?.name === 1 ? "Guest" : "Guests";
      onGuestCountChange(`${selected?.name} ${guestLabel}`);
    }
  }, [selected, onGuestCountChange]);

  return (
    <div className="rounded-3xl p-[9%] mb-5 w-full">
      <Listbox value={selected} onChange={setSelected}>
        <div className="relative">
          <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
            <span className="block truncate text-md lg:text-lg">
              {selected?.name} {selected?.name === 1 ? "Guest" : "Guests"}
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
                          <span>
                            {person.name}{" "}
                            {person.name === 1 ? "Guest" : "Guests"}
                          </span>
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
