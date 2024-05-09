import { removeAttendee } from "@/services/src/organiser/organiserService";
import { Menu, Transition } from "@headlessui/react";
import { EllipsisVerticalIcon, UserCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import React, { Fragment } from "react";

interface EventDrilldownAttendeeCardProps {
  name: string;
  email: string;
  number: string;
  tickets: number;
}

const EventDrilldownAttendeeCard = ({ tickets, name, email, number }: EventDrilldownAttendeeCardProps) => {
  return (
    <div className="grid grid-flow-col justify-stretch py-2 grid-cols-7 flex items-center">
      <div className="col-span-1 w-14 text-center">{tickets}</div>
      <div className="flex flex-row items-center col-span-2">
        <UserCircleIcon className="stroke-1 w-10 mr-2" />
        <div className="">{name}</div>
      </div>
      <div className="col-span-3">{email}</div>
      <div className={`col-span-1 ${number === null ? "text-gray-300" : ""}`}>{number === null ? "N/A" : number}</div>
      <Menu as="div" className="relative">
        <div>
          <Menu.Button>
            <div className="p-1.5 cursor-pointer rounded-full hover:bg-organiser-darker-light-gray hover:ease-in transition">
              <EllipsisVerticalIcon className="w-6" />
            </div>
          </Menu.Button>
        </div>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 mt-1 w-52 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
            <div className="px-1 py-1">
              <Menu.Item>
                {({ active }) => (
                  <Link
                    href="/profile"
                    className={`${
                      active ? "text-white bg-black" : "text-black"
                    } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                  >
                    <UserCircleIcon className="h-5 mr-2" />
                    Profile
                  </Link>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <div
                    className={`${
                      active ? "text-white bg-black" : "text-black"
                    } group flex w-full items-center rounded-md px-2 py-2 text-sm hover:cursor-pointer`}
                    onClick={() => removeAttendee(email)}
                  >
                    <XMarkIcon className="h-5 mr-2" />
                    Remove attendee
                  </div>
                )}
              </Menu.Item>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  );
};

export default EventDrilldownAttendeeCard;
