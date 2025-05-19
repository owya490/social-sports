import { handleSignOut } from "@/services/src/auth/authService";
import { Menu, MenuButton, MenuItems, Transition } from "@headlessui/react";
import {
  ArrowLeftStartOnRectangleIcon,
  LifebuoyIcon,
  LightBulbIcon,
  PencilSquareIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { HighlightButton, InvertedHighlightButton } from "../elements/HighlightButton";
import LoadingSkeletonSmall from "../loading/LoadingSkeletonSmall";
import { useUser } from "../utility/UserContext";
import { bustEventsLocalStorageCache } from "@/services/src/events/eventsUtils/getEventsUtils";
import { bustUserLocalStorageCache } from "@/services/src/users/usersUtils/getUsersUtils";

export default function ProfilePic() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const router = useRouter();
  const { userLoading, user, setUser } = useUser();
  // const defaultProfilePicturePath = "users/generic/generic-profile-photo.webp";

  useEffect(() => {
    if (!userLoading) {
      if (user.userId !== "") {
        console.log(user.userId);
        setLoggedIn(true);
      } else {
        setLoggedIn(false);
      }
      setLoading(false);
    }
  }, [userLoading, user]);

  const handleLogOut = () => {
    handleSignOut(setUser);
    // clearing all caches and relaoding page as we have magical bug where users are re-signed in...
    bustEventsLocalStorageCache()
    bustUserLocalStorageCache()
    location.reload();
    router.push("/");
  };

  //TODO: Refactor !loggedin as hard to read
  return loading ? (
    <div className="flex ml-auto">
      <div className="mr-4 hidden md:block">
        <LoadingSkeletonSmall />
      </div>
      <div>
        <Skeleton
          circle
          height={40}
          width={40}
          wrapper={({ children }) => {
            return <div className="flex items-center">{children}</div>;
          }}
        />
      </div>
    </div>
  ) : (
    <div className="ml-auto flex items-center">
      {loggedIn && (
        <HighlightButton
          text="Create event"
          onClick={() => {
            router.push("/event/create");
          }}
          className="mx-3 hidden lg:block"
        />
      )}
      {!loggedIn && (
        <div className="flex">
          <HighlightButton text="Login" onClick={() => router.push("/login")} className="px-6 ml-3" />
          <InvertedHighlightButton
            text="Register"
            onClick={() => router.push("/register")}
            className="hidden lg:block ml-4"
          />
        </div>
      )}
      {loggedIn && (
        <div className="flex items-center">
          <Menu as="div" className="relative inline-block text-left">
            <div className="flex items-centers">
              <MenuButton className="inline-flex justify-center rounded-full overflow-hidden  border border-core-outline">
                <Image
                  priority
                  src={user.profilePicture}
                  alt="DP"
                  width={0}
                  height={0}
                  className="object-cover h-10 w-10"
                />
              </MenuButton>
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
              <MenuItems className="absolute right-0 mt-1 w-52 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  {loggedIn && (
                    <div>
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href="/profile"
                            className={`${
                              active ? "text-core-text bg-core-hover" : "text-core-text"
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
                            href="/organiser/dashboard"
                            className={`${
                              active ? "text-core-text bg-core-hover" : "text-core-text"
                            } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                          >
                            <LifebuoyIcon className="h-5 mr-2" />
                            Organiser Hub
                          </Link>
                        )}
                      </Menu.Item>
                    </div>
                  )}
                </div>
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        href="/event/create"
                        className={`${
                          active ? "text-core-text bg-core-hover" : "text-core-text"
                        } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                      >
                        <PencilSquareIcon className="h-5 mr-2" />
                        Create event
                      </Link>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        href="/contact"
                        className={`${
                          active ? "text-core-text bg-core-hover" : "text-core-text"
                        } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                      >
                        <LightBulbIcon className="h-5 mr-2" />
                        Contact Us
                      </Link>
                    )}
                  </Menu.Item>
                </div>
                <div className=" py-1">
                  {loggedIn && (
                    <Menu.Item>
                      {({ active }) => (
                        <div
                          onClick={handleLogOut}
                          className={`${
                            active ? "text-core-text bg-core-hover" : "text-core-text"
                          } group flex w-full items-center rounded-md px-2 py-2 text-sm cursor-pointer`}
                        >
                          <ArrowLeftStartOnRectangleIcon className="h-5 mr-2" />
                          Log Out
                        </div>
                      )}
                    </Menu.Item>
                  )}
                </div>
              </MenuItems>
            </Transition>
          </Menu>
        </div>
      )}
    </div>
  );
}
