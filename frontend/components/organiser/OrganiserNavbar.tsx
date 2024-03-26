"use client";

import {
  BookmarkSquareIcon,
  CalendarIcon,
  CameraIcon,
  ChartBarIcon,
  HomeIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

export default function OrganiserNavbar() {
  return (
    <div className="bg-organiser-light-gray drop-shadow-lg fixed left-0 h-screen z-40">
      <div className="w-14 flex flex-col mt-14 space-y-3">
        <Link href="/organiser/dashboard/">
          <div className="flex justify-center h-10 w-10 m-auto rounded-md hover:bg-organiser-darker-light-gray transition ease-in-out">
            <HomeIcon className="w-6 stroke-1 stroke-organiser-dark-gray-text" />
          </div>
        </Link>
        <Link href="/organiser/event">
          <div className="flex justify-center h-10 w-10 m-auto rounded-md hover:bg-organiser-darker-light-gray transition ease-in-out">
            <CalendarIcon className="w-6 stroke-1 stroke-organiser-dark-gray-text" />
          </div>
        </Link>
        <Link href="/organiser/event/asdf">
          <div className="flex justify-center h-10 w-10 m-auto rounded-md hover:bg-organiser-darker-light-gray transition ease-in-out">
            <BookmarkSquareIcon className="w-6 stroke-1 stroke-organiser-dark-gray-text" />
          </div>
        </Link>
        <Link href="/organiser/metrics">
          <div className="flex justify-center h-10 w-10 m-auto rounded-md hover:bg-organiser-darker-light-gray transition ease-in-out">
            <ChartBarIcon className="w-6 stroke-1 stroke-organiser-dark-gray-text" />
          </div>
        </Link>
        <Link href="/organiser/gallery">
          <div className="flex justify-center h-10 w-10 m-auto rounded-md hover:bg-organiser-darker-light-gray transition ease-in-out">
            <CameraIcon className="w-6 stroke-1 stroke-organiser-dark-gray-text" />
          </div>
        </Link>
        <Link href="/organiser/settings">
          <div className="flex justify-center h-10 w-10 m-auto rounded-md hover:bg-organiser-darker-light-gray transition ease-in-out">
            <UserIcon className="w-6 stroke-1 stroke-organiser-dark-gray-text" />
          </div>
        </Link>
      </div>
    </div>
  );
}
