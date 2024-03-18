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
      <div className="w-14 flex flex-col mt-14 space-y-10">
        <Link href="/organiser/dashboard">
          <div className="flex justify-center">
            <HomeIcon className="w-6 stroke-1 stroke-organiser-dark-gray-text" />
          </div>
        </Link>
        <Link href="/organiser/dashboard">
          <div className="flex justify-center">
            <CalendarIcon className="w-6 stroke-1 stroke-organiser-dark-gray-text" />
          </div>
        </Link>
        <Link href="/organiser/dashboard">
          <div className="flex justify-center">
            <BookmarkSquareIcon className="w-6 stroke-1 stroke-organiser-dark-gray-text" />
          </div>
        </Link>
        <Link href="/organiser/dashboard">
          <div className="flex justify-center">
            <ChartBarIcon className="w-6 stroke-1 stroke-organiser-dark-gray-text" />
          </div>
        </Link>
        <Link href="/organiser/dashboard">
          <div className="flex justify-center">
            <CameraIcon className="w-6 stroke-1 stroke-organiser-dark-gray-text" />
          </div>
        </Link>
        <Link href="/organiser/dashboard">
          <div className="flex justify-center">
            <UserIcon className="w-6 stroke-1 stroke-organiser-dark-gray-text" />
          </div>
        </Link>
      </div>
    </div>
  );
}
