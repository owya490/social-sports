"use client";

import { FormId } from "@/interfaces/FormTypes";
import React from "react";
import { Menu, MenuButton, MenuItems, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { ArrowTopRightOnSquareIcon, EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { TrashIcon } from "@heroicons/react/24/outline";

export interface FormsCardProps {
  formId: FormId;
  image: string;
  name: string;
  loading?: boolean;
}

const FormsCard = (props: FormsCardProps) => {
  return (
    <div className="bg-white rounded-lg text-left border-gray-300 border w-full sm:w-[600px] xl:w-[580px] 2xl:w-[640px] hover:cursor-pointer">
      <div
        className="h-36 w-full object-cover rounded-t-lg border-b border-gray-300"
        style={{
          backgroundImage: `url(${props.image})`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
        }}
      ></div>
      <div className="flex items-center justify-between p-4">
        <h2 className="text-xl font-bold whitespace-nowrap overflow-hidden">{props.name}</h2>
        <Menu as="div" className="relative">
          <MenuButton className="p-1 hover:bg-gray-100 rounded-full">
            <EllipsisVerticalIcon className="w-6 h-6" />
          </MenuButton>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <MenuItems className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
              <div className="py-1">
                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  onClick={() => window.open(`/organiser/forms/${props.formId}`, "_blank")}
                >
                  <ArrowTopRightOnSquareIcon className="h-5 w-5 mr-2" />
                  Open in new tab
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                  onClick={() => {
                    // Add delete handler here
                  }}
                >
                  <TrashIcon className="h-5 w-5 mr-2" />
                  Delete
                </button>
              </div>
            </MenuItems>
          </Transition>
        </Menu>
      </div>
    </div>
  );
};

export default FormsCard;
