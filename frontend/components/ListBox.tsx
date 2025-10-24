"use client";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { Fragment, useState } from "react";
import { SortByCategory } from "./Filter/FilterDialog";

interface ListBoxProps {
  onChangeHandler: (e: any) => void;
  options: IOption[];
  sortByCategory: SortByCategory;
  textSize?: "xs" | "sm" | "md" | "lg" | "xl";
}

export interface IOption {
  name: string;
  value: any;
}

export default function ListBox(props: ListBoxProps) {
  const [selected, setSelected] = useState(props.options[props.sortByCategory]);

  return (
    <div className="rounded-3xl w-full">
      <Listbox value={selected} onChange={setSelected}>
        <div className="relative">
          <Listbox.Button
            className={`relative w-full cursor-default rounded-lg bg-white ${
              props.textSize === "sm" ? "py-1.5 pl-2.5 pr-8" : "py-2 pl-3 pr-10"
            } text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm border`}
          >
            <span className={`block truncate text-${props.textSize ? props.textSize : "lg"}`}>{selected.name}</span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-tops pr-2">
              <ChevronUpDownIcon
                className={`${props.textSize === "sm" ? "h-5 w-5 mt-0.5" : "h-7 w-7 mt-1 lg:mt-2"} text-gray-400`}
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>
          <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
            <Listbox.Options
              className={`absolute ${
                props.textSize === "sm" ? "max-h-[140px]" : "max-h-[160px] md:max-h-[200px] 2xl:max-h-[210px]"
              } w-full overflow-auto rounded-md bg-white py-1 ${
                props.textSize === "sm" ? "text-sm" : "text-base"
              } shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50`}
            >
              {props.options.map((option, optionIdx) => (
                <Listbox.Option
                  key={optionIdx}
                  onClick={() => {
                    props.onChangeHandler(option.value);
                  }}
                  className={({ active }) =>
                    `relative cursor-default select-none ${
                      props.textSize === "sm" ? "py-1.5 pl-8 pr-3" : "py-2 pl-10 pr-4"
                    } ${active ? "bg-blue-100 text-blue-900" : "text-gray-900"}`
                  }
                  value={option}
                >
                  {({ selected }) => (
                    <>
                      <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>
                        {option.name}
                      </span>
                      {selected ? (
                        <span
                          className={`absolute inset-y-0 left-0 flex items-center ${
                            props.textSize === "sm" ? "pl-2" : "pl-3"
                          } text-blue-600`}
                        >
                          <CheckIcon
                            className={`${props.textSize === "sm" ? "h-4 w-4" : "h-5 w-5"}`}
                            aria-hidden="true"
                          />
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
