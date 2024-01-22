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
import { Fragment, useEffect, useState } from "react";
import DP from "./../../public/images/Ashley & Owen.png";
import { handleSignOut } from "@/services/authService";
import Link from "next/link";
import { auth } from "@/services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function ProfilePic() {
  const [loggedIn, setLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setLoggedIn(true);
      } else {
        setLoggedIn(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      {loggedIn && (
        <button
          className="border border-black px-4 py-2 rounded-lg mx-3 max-h-[40px] hidden lg:block whitespace-nowrap"
          onClick={() => {
            router.push("/event/create");
          }}
        >
          Create Event
        </button>
      )}
      {!loggedIn && (
        <div className="flex">
          <button
            className="border border-black px-4 py-2 rounded-full max-h-[40px] lg:block bg-black text-white whitespace-nowrap ml-4"
            onClick={() => router.push("/login")}
          >
            Login
          </button>
          <button
            className="border border-black px-4 py-2 rounded-full max-h-[40px] lg:block whitespace-nowrap ml-4 hidden sm:block"
            onClick={() => router.push("/register")}
          >
            Register
          </button>
        </div>
      )}
      {loggedIn && (
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
                  {!loggedIn && (
                    <>
                      <Menu.Item>
                        {({ active }) => (
                          <span>
                            <Link
                              href="/login"
                              className={`${
                                active
                                  ? "bg-violet-500 text-white"
                                  : "text-gray-900"
                              } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                            >
                              <ArrowRightOnRectangleIcon className="h-5 mr-2" />
                              Log In
                            </Link>
                          </span>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href="/register"
                            className={`${
                              active
                                ? "bg-violet-500 text-white"
                                : "text-gray-900"
                            } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                          >
                            <PencilSquareIcon className="h-5 mr-2" />
                            Register
                          </Link>
                        )}
                      </Menu.Item>
                    </>
                  )}
                </div>
                {loggedIn && (
                  <div className="px-1 py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href="/profile"
                          className={`${
                            active
                              ? "bg-violet-500 text-white"
                              : "text-gray-900"
                          } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                        >
                          <UserCircleIcon className="h-5 mr-2" />
                          Profile
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href="/settings"
                          className={`${
                            active
                              ? "bg-violet-500 text-white"
                              : "text-gray-900"
                          } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                        >
                          <Cog8ToothIcon className="h-5 mr-2" />
                          Settings
                        </Link>
                      )}
                    </Menu.Item>
                  </div>
                )}
                <div className="px-1 py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        href="/help"
                        className={`${
                          active ? "bg-violet-500 text-white" : "text-gray-900"
                        } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                      >
                        <LifebuoyIcon className="h-5 mr-2" />
                        Help Centre
                      </Link>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        href="/suggestions"
                        className={`${
                          active ? "bg-violet-500 text-white" : "text-gray-900"
                        } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                      >
                        <LightBulbIcon className="h-5 mr-2" />
                        Suggestions
                      </Link>
                    )}
                  </Menu.Item>
                </div>
                {loggedIn && (
                  <div className="px-1 py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <div
                          onClick={handleSignOut}
                          className={`${
                            active
                              ? "bg-violet-500 text-white"
                              : "text-gray-900"
                          } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                        >
                          <ArrowLeftOnRectangleIcon className="h-5 mr-2" />
                          Log Out
                        </div>
                      )}
                    </Menu.Item>
                  </div>
                )}
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      )}
    </>
  );
}
