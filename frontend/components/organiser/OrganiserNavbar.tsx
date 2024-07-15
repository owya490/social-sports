"use client";

import { BookmarkSquareIcon, ChartBarIcon, HomeIcon, UserIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

interface OrganiserNavbarProps {
  currPage: string;
}

export default function OrganiserNavbar({ currPage }: OrganiserNavbarProps) {
  return (
    <div className="bg-organiser-light-gray drop-shadow-lg fixed left-0 h-screen z-40">
      <div className="w-14 flex flex-col mt-14 space-y-3">
        <Link href="/organiser/dashboard/">
          <div
            className={`flex justify-center h-10 w-10 m-auto rounded-md hover:bg-organiser-darker-light-gray transition ease-in-out ${
              currPage === "Dashboard" && "bg-organiser-darker-light-gray"
            }`}
          >
            <HomeIcon className="w-6 stroke-1 stroke-organiser-dark-gray-text" />
          </div>
        </Link>
        {/* <Link href="/organiser/event/dashboard">
          <div
            className={`flex justify-center h-10 w-10 m-auto rounded-md hover:bg-organiser-darker-light-gray transition ease-in-out ${
              currPage === "Event" && "bg-organiser-darker-light-gray"
            }`}
          >
            <CalendarIcon className="w-6 stroke-1 stroke-organiser-dark-gray-text" />
          </div>
        </Link> */}
        <Link href="/organiser/event/dashboard">
          <div
            className={`flex justify-center h-10 w-10 m-auto rounded-md hover:bg-organiser-darker-light-gray transition ease-in-out ${
              currPage === "EventDrilldown" && "bg-organiser-darker-light-gray"
            }`}
          >
            <BookmarkSquareIcon className="w-6 stroke-1 stroke-organiser-dark-gray-text" />
          </div>
        </Link>
        <Link href="/organiser/metrics">
          <div
            className={`flex justify-center h-10 w-10 m-auto rounded-md hover:bg-organiser-darker-light-gray transition ease-in-out ${
              currPage === "Metrics" && "bg-organiser-darker-light-gray"
            }`}
          >
            <ChartBarIcon className="w-6 stroke-1 stroke-organiser-dark-gray-text" />
          </div>
        </Link>
        {/* <Link href="/organiser/gallery">
          <div
            className={`flex justify-center h-10 w-10 m-auto rounded-md hover:bg-organiser-darker-light-gray transition ease-in-out ${
              currPage === "Gallery" && "bg-organiser-darker-light-gray"
            }`}
          >
            <CameraIcon className="w-6 stroke-1 stroke-organiser-dark-gray-text" />
          </div>
        </Link> */}
        <Link href="/organiser/settings">
          <div
            className={`flex justify-center h-10 w-10 m-auto rounded-md hover:bg-organiser-darker-light-gray transition ease-in-out ${
              currPage === "Settings" && "bg-organiser-darker-light-gray"
            }`}
          >
            <UserIcon className="w-6 stroke-1 stroke-organiser-dark-gray-text" />
          </div>
        </Link>
      </div>
    </div>
  );
}
