import { handleSignOut } from "@/services/src/auth/authService";
import { auth, storage } from "@/services/src/firebase";
import { sleep } from "@/utilities/sleepUtil";
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from "@headlessui/react";
import {
  ArrowLeftStartOnRectangleIcon,
  Cog8ToothIcon,
  LifebuoyIcon,
  LightBulbIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { onAuthStateChanged } from "firebase/auth";
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
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const router = useRouter();
  const { user, setUser } = useUser();
  const [profilePictureURL, setProfilePictureURL] = useState<string>("");
  const defaultProfilePicturePath = "users/generic/generic-profile-photo.webp";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setLoggedIn(true);
      } else {
        setLoggedIn(false);
      }
      sleep(100).then(() => {
        setLoading(false);
      });
    });

    return () => unsubscribe();
  }, [user?.profilePicture]);

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
    handleSignOut(setUser);
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
      {loggedIn && (
        <button
          className="border border-black px-4 py-2 rounded-lg mx-3 max-h-[40px] hidden lg:block whitespace-nowrap hover:bg-black hover:text-white"
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
      {loggedIn && (
        <div className="flex items-center">
          <Menu as="div" className="relative inline-block text-left">
            <div className="flex items-centers">
              <MenuButton className="inline-flex justify-center rounded-full overflow-hidden  border border-black">
                <Image
                  priority
                  src={user?.profilePicture || profilePictureURL}
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
                {loggedIn && (
                  <div className="px-1 py-1">
                    <MenuItem>
                      <Link
                        href="/profile"
                        className={`text-black group flex w-full items-center rounded-md px-2 py-2 text-sm hover:text-white hover:bg-black`}
                      >
                        <UserCircleIcon className="h-5 mr-2" />
                        Profile
                      </Link>
                    </MenuItem>
                    <MenuItem>
                      <Link
                        href="/settings"
                        className={`text-black group flex w-full items-center rounded-md px-2 py-2 text-sm hover:text-white hover:bg-black`}
                      >
                        <Cog8ToothIcon className="h-5 mr-2" />
                        Settings
                      </Link>
                    </MenuItem>
                  </div>
                )}
                <div className="px-1 py-1">
                  <MenuItem>
                    <Link
                      href="/help"
                      className={`text-black group flex w-full items-center rounded-md px-2 py-2 text-sm hover:text-white hover:bg-black`}
                    >
                      <LifebuoyIcon className="h-5 mr-2" />
                      Help Centre
                    </Link>
                  </MenuItem>
                  <MenuItem>
                    <Link
                      href="/suggestions"
                      className={`text-black group flex w-full items-center rounded-md px-2 py-2 text-sm hover:text-white hover:bg-black`}
                    >
                      <LightBulbIcon className="h-5 mr-2" />
                      Suggestions
                    </Link>
                  </MenuItem>
                </div>
                {loggedIn && (
                  <div className="px-1 py-1">
                    <MenuItem>
                      <div
                        onClick={handleLogOut}
                        className={`text-black group flex w-full items-center rounded-md px-2 py-2 text-sm cursor-pointer hover:text-white hover:bg-black`}
                      >
                        <ArrowLeftStartOnRectangleIcon className="h-5 mr-2" />
                        Log Out
                      </div>
                    </MenuItem>
                  </div>
                )}
              </MenuItems>
            </Transition>
          </Menu>
        </div>
      )}
    </div>
  );
}
