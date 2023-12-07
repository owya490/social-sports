import { Menu, Transition } from "@headlessui/react";
import {
  ArrowLeftOnRectangleIcon,
  ArrowRightOnRectangleIcon,
  Cog8ToothIcon,
  LifebuoyIcon,
  LightBulbIcon,
  PencilSquareIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { Fragment } from "react";
import DP from "./../../public/images/Ashley & Owen.png";
const loggedin = false;

export default function ProfilePic() {
  return (
    <div className="flex items-center">
      <Menu as="div" className="relative inline-block text-left">
        <div className="flex items-centers">
          <Menu.Button className="inline-flex w-full justify-center">
            <Image
              src={DP}
              alt="DP"
              width={0}
              height={0}
              className="rounded-full w-10 h-10 border border-black"
            />
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
          <Menu.Items className="absolute right-0 mt-1 w-52 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="px-1 py-1">
              {!loggedin && (
                <>
                  <Menu.Item>
                    {({ active }) => (
                      <span>
                        <a
                          href="/login"
                          className={`${
                            active
                              ? "bg-violet-500 text-white"
                              : "text-gray-900"
                          } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                        >
                          <ArrowRightOnRectangleIcon className="h-5 mr-2" />
                          Log In
                        </a>
                      </span>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <a
                        href="/register"
                        className={`${
                          active ? "bg-violet-500 text-white" : "text-gray-900"
                        } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                      >
                        <PencilSquareIcon className="h-5 mr-2" />
                        Register
                      </a>
                    )}
                  </Menu.Item>
                </>
              )}
            </div>
            {loggedin && (
              <div className="px-1 py-1">
                <Menu.Item>
                  {({ active }) => (
                    <a
                      href="/profile"
                      className={`${
                        active ? "bg-violet-500 text-white" : "text-gray-900"
                      } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                    >
                      <UserCircleIcon className="h-5 mr-2" />
                      Profile
                    </a>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <a
                      href="/settings"
                      className={`${
                        active ? "bg-violet-500 text-white" : "text-gray-900"
                      } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                    >
                      <Cog8ToothIcon className="h-5 mr-2" />
                      Settings
                    </a>
                  )}
                </Menu.Item>
              </div>
            )}
            <div className="px-1 py-1">
              <Menu.Item>
                {({ active }) => (
                  <a
                    href="/help"
                    className={`${
                      active ? "bg-violet-500 text-white" : "text-gray-900"
                    } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                  >
                    <LifebuoyIcon className="h-5 mr-2" />
                    Help Centre
                  </a>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <a
                    href="/suggestions"
                    className={`${
                      active ? "bg-violet-500 text-white" : "text-gray-900"
                    } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                  >
                    <LightBulbIcon className="h-5 mr-2" />
                    Suggestions
                  </a>
                )}
              </Menu.Item>
            </div>
            {loggedin && (
              <div className="px-1 py-1">
                <Menu.Item>
                  {({ active }) => (
                    <a
                      href="/logout"
                      className={`${
                        active ? "bg-violet-500 text-white" : "text-gray-900"
                      } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                    >
                      <ArrowLeftOnRectangleIcon className="h-5 mr-2" />
                      Log Out
                    </a>
                  )}
                </Menu.Item>
              </div>
            )}
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  );
}
