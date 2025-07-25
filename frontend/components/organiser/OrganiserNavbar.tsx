"use client";

import { EmptyEventData, EventData } from "@/interfaces/EventTypes";
import { getOrganiserEvents } from "@/services/src/events/eventsService";
import { useUser } from "@components/utility/UserContext";
import { Menu, MenuButton, MenuItems, Transition } from "@headlessui/react";
import {
  ArrowPathIcon,
  BookmarkSquareIcon,
  CalendarIcon,
  CameraIcon,
  ChartBarIcon,
  HomeIcon,
  LinkIcon,
  StarIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { Tooltip } from "@material-tailwind/react";
import { Timestamp } from "firebase/firestore";
import Link from "next/link";
import { Fragment, useEffect, useState, ReactNode } from "react";

interface OrganiserNavbarProps {
  currPage: string;
}

interface ResponsiveTooltipProps {
  content: string;
  children: ReactNode;
}

const ResponsiveTooltip = ({ content, children }: ResponsiveTooltipProps) => {
  return (
    <div className="relative">
      <div className="hidden sm:block">
        <Tooltip content={content} placement="right" className="absolute left-full ml-2">
          {children}
        </Tooltip>
      </div>
      <div className="block sm:hidden">
        <Tooltip content={content} placement="top">
          {children}
        </Tooltip>
      </div>
    </div>
  );
};

interface NavButtonProps {
  href: string;
  isActive: boolean;
  tooltipContent: string;
  children: ReactNode;
}

const NavButton = ({ href, isActive, tooltipContent, children }: NavButtonProps) => {
  return (
    <ResponsiveTooltip content={tooltipContent}>
      <Link
        href={href}
        className={`flex justify-center self-center h-10 w-10 sm:h-10 sm:w-10 sm:m-auto rounded-md hover:bg-core-hover transition ease-in-out ${
          isActive && "bg-core-hover"
        }`}
      >
        {children}
      </Link>
    </ResponsiveTooltip>
  );
};

export default function OrganiserNavbar({ currPage }: OrganiserNavbarProps) {
  const { user } = useUser();
  const [_eventDataList, setEventDataList] = useState<EventData[]>([EmptyEventData, EmptyEventData]);
  const [_closestEvent, setClosestEvent] = useState<EventData | null>(null);
  const [eventId, setEventId] = useState<string>("dashboard");

  useEffect(() => {
    const fetchEvents = async () => {
      if (user.userId === "") {
        return;
      }

      if (
        currPage === "EventDrilldown" &&
        typeof window !== "undefined" &&
        window.location.pathname.includes("/organiser/event/")
      ) {
        const pathParts = window.location.pathname.split("/");
        const lastPart = pathParts[pathParts.length - 1];
        setEventId(lastPart);
        return;
      }

      try {
        const events = await getOrganiserEvents(user.userId);

        const futureEvents = events.filter((event) => {
          return event.startDate.seconds - Timestamp.now().seconds > 0;
        });

        futureEvents.sort((a, b) => a.startDate.seconds - b.startDate.seconds);

        setEventDataList(futureEvents);
        setClosestEvent(futureEvents.length > 0 ? futureEvents[0] : null);
        setEventId(futureEvents.length > 0 ? `${futureEvents[0].eventId}` : "dashboard");
      } catch (error) {
        console.error("getOrganiserEvents() Error: " + error);
      }
    };

    fetchEvents();
  }, [user]);

  return (
    <div className="bg-white border-r-[1px] border-core-outline fixed bottom-0 sm:bottom-auto inset-x-0 sm:inset-x-auto sm:left-0 sm:h-screen z-40">
      <div className="flex justify-center items-center h-12 sm:h-auto sm:w-14 sm:flex-col sm:mt-14 sm:space-y-3 sm:space-x-0 space-x-3">
        <NavButton href="/organiser/dashboard/" isActive={currPage === "Dashboard"} tooltipContent="Dashboard">
          <HomeIcon className="w-6 stroke-1 stroke-core-text" />
        </NavButton>

        <ResponsiveTooltip content="Events">
          <Menu as="div" className="relative inline-block text-left">
            <div className="flex items-centers">
              <MenuButton
                className={`flex justify-center items-center self-center h-10 w-10 sm:h-10 sm:w-10 sm:m-auto rounded-md hover:bg-core-hover transition ease-in-out ${
                  currPage === "EventDashboard" && "bg-core-hover"
                }`}
              >
                <CalendarIcon className="w-6 stroke-1 stroke-core-text" />
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
              <MenuItems className="absolute bottom-16 left-0 md:left-16 md:top-0 mt-1 w-52 h-fit origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="px-1 py-1 ">
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        href="/organiser/event/dashboard"
                        className={`${
                          active ? "text-core-text bg-core-hover" : "text-core-text"
                        } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                      >
                        <StarIcon className="w-6 stroke-1 mr-2" />
                        Event Dashboard
                      </Link>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        href="/organiser/recurring-events"
                        className={`${
                          active ? "text-core-text bg-core-hover" : "text-core-text"
                        } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                      >
                        <ArrowPathIcon className="w-6 stroke-1 mr-2" />
                        Recurring Events
                      </Link>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        href="/organiser/event/custom-links"
                        className={`${
                          active ? "text-core-text bg-core-hover" : "text-core-text"
                        } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                      >
                        <LinkIcon className="w-6 stroke-1 mr-2" />
                        Custom Event Links
                      </Link>
                    )}
                  </Menu.Item>
                </div>
              </MenuItems>
            </Transition>
          </Menu>
        </ResponsiveTooltip>

        <NavButton
          href={`/organiser/event/${eventId}`}
          isActive={currPage === "EventDrilldown"}
          tooltipContent="Current Event"
        >
          <BookmarkSquareIcon className="w-6 stroke-1 stroke-core-text" />
        </NavButton>

        <NavButton href="/organiser/metrics" isActive={currPage === "Metrics"} tooltipContent="Metrics">
          <ChartBarIcon className="w-6 stroke-1 stroke-core-text" />
        </NavButton>

        <NavButton href="/organiser/gallery" isActive={currPage === "Gallery"} tooltipContent="Gallery">
          <CameraIcon className="w-6 stroke-1 stroke-core-text" />
        </NavButton>

        <NavButton href="/organiser/settings" isActive={currPage === "Settings"} tooltipContent="Settings">
          <UserIcon className="w-6 stroke-1 stroke-core-text" />
        </NavButton>
      </div>
    </div>
  );
}
