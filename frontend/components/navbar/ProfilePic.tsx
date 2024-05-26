import { handleSignOut } from "@/services/src/auth/authService";
import { storage } from "@/services/src/firebase";
import { sleep } from "@/utilities/sleepUtil";
import { Menu, Transition } from "@headlessui/react";
import {
  ArrowLeftOnRectangleIcon,
  Cog8ToothIcon,
  LifebuoyIcon,
  LightBulbIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { getDownloadURL, ref } from "firebase/storage";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import LoadingSkeletonSmall from "../loading/LoadingSkeletonSmall";
import { useUser } from "../utility/UserContext";

export default function ProfilePic() {
  const router = useRouter();
  const { user, isLoggedIn, logUserOut } = useUser();
  const [loading, setLoading] = useState(user.userId !== "loading");
  const [profilePictureURL, setProfilePictureURL] = useState<string>("");
  const defaultProfilePicturePath = "users/generic/generic-profile-photo.webp";

  useEffect(() => {
    const fetchProfilePictureURL = async () => {
      if (user?.profilePicture) {
        const storageRef = ref(storage, defaultProfilePicturePath);
        try {
          const url = await getDownloadURL(storageRef);
          setProfilePictureURL(url);
        } catch (error) {
          console.error("Error fetching profile picture URL:", error);
        }
      }
    };

    fetchProfilePictureURL();
  }, [user?.profilePicture]);

  const handleLogOut = () => {
    handleSignOut(logUserOut);
    router.push("/");
  };

  return loading ? (
    <div className="flex ml-auto">
      <div className="mr-4">
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
      {isLoggedIn() && (
        <button
          className="border border-black px-4 py-2 rounded-lg mx-3 max-h-[40px] hidden lg:block whitespace-nowrap hover:bg-black hover:text-white"
          onClick={() => {
            router.push("/event/create");
          }}
        >
          Create Event
        </button>
      )}
      {!isLoggedIn() && (
        <div className="flex">
          <button
            className="border border-black px-4 py-2 rounded-lg max-h-[40px] lg:block bg-black text-white whitespace-nowrap ml-4 hover:bg-white hover:text-black"
            onClick={() => router.push("/login")}
          >
            Login
          </button>
          <button
            className="border border-black px-4 py-2 rounded-lg max-h-[40px] lg:block whitespace-nowrap ml-4 hidden sm:block hover:bg-black hover:text-white"
            onClick={() => router.push("/register")}
          >
            Register
          </button>
        </div>
      )}
      {isLoggedIn() && (
        <div className="flex items-center">
          <Menu as="div" className="relative inline-block text-left">
            <div className="flex items-centers">
              <Menu.Button className="inline-flex justify-center rounded-full overflow-hidden  border border-black">
                <Image
                  priority
                  src={user?.profilePicture || profilePictureURL}
                  alt="DP"
                  width={0}
                  height={0}
                  className="object-cover h-10 w-10"
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
                {isLoggedIn() && (
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
                        <Link
                          href="/settings"
                          className={`${
                            active ? "text-white bg-black" : "text-black"
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
                          active ? "text-white bg-black" : "text-black"
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
                          active ? "text-white bg-black" : "text-black"
                        } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                      >
                        <LightBulbIcon className="h-5 mr-2" />
                        Suggestions
                      </Link>
                    )}
                  </Menu.Item>
                </div>
                {isLoggedIn() && (
                  <div className="px-1 py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <div
                          onClick={handleLogOut}
                          className={`${
                            active ? "text-white bg-black" : "text-black"
                          } group flex w-full items-center rounded-md px-2 py-2 text-sm cursor-pointer`}
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
    </div>
  );
}
