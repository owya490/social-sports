"use client";

import { EmptyEventData, EventData } from "@/interfaces/EventTypes";
import { getOrganiserEvents } from "@/services/src/events/eventsService";
import { useUser } from "@components/utility/UserContext";
import {
  BookmarkSquareIcon,
  CalendarIcon,
  CameraIcon,
  ChartBarIcon,
  HomeIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { Timestamp } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useState } from "react";

interface OrganiserNavbarProps {
  currPage: string;
}

export default function OrganiserNavbar({ currPage }: OrganiserNavbarProps) {
  const { user } = useUser();
  const [eventDataList, setEventDataList] = useState<EventData[]>([EmptyEventData, EmptyEventData]);
  const [closestEvent, setClosestEvent] = useState<EventData | null>(null);
  const [eventId, setEventId] = useState<string>("");

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
        setEventId(futureEvents.length > 0 ? `organiser/event/${futureEvents[0].eventId}` : "event/create");
      } catch (error) {
        console.error("getOrganiserEvents() Error: " + error);
      }
    };

    fetchEvents();
  }, [user]);

  return (
    <div className="bg-organiser-light-gray drop-shadow-lg fixed bottom-0 sm:bottom-auto inset-x-0 sm:inset-x-auto sm:left-0 sm:h-screen z-40">
      <div className="flex justify-center h-16 sm:h-auto sm:w-14 sm:flex-col sm:mt-14 sm:space-y-3 sm:space-x-0 space-x-3">
        <Link
          href="/organiser/dashboard/"
          className={`flex justify-center self-center h-12 w-12 sm:h-10 sm:w-10 sm:m-auto rounded-md hover:bg-organiser-darker-light-gray transition ease-in-out ${
            currPage === "Dashboard" && "bg-organiser-darker-light-gray"
          }`}
        >
          <HomeIcon className="w-10 sm:w-6 stroke-1 stroke-organiser-dark-gray-text" />
        </Link>
        <Link
          href="/organiser/event/dashboard"
          className={`flex justify-center self-center h-12 w-12 sm:h-10 sm:w-10 sm:m-auto rounded-md hover:bg-organiser-darker-light-gray transition ease-in-out ${
            currPage === "EventDashboard" && "bg-organiser-darker-light-gray"
          }`}
        >
          <CalendarIcon className="w-10 sm:w-6 stroke-1 stroke-organiser-dark-gray-text" />
        </Link>
        <Link
          href={`/${eventId}`}
          className={`flex justify-center self-center h-12 w-12 sm:h-10 sm:w-10 sm:m-auto rounded-md hover:bg-organiser-darker-light-gray transition ease-in-out ${
            currPage === "EventDrilldown" && "bg-organiser-darker-light-gray"
          }`}
        >
          <BookmarkSquareIcon className="w-10 sm:w-6 stroke-1 stroke-organiser-dark-gray-text" />
        </Link>
        <Link
          href="/organiser/metrics"
          className={`flex justify-center self-center h-12 w-12 sm:h-10 sm:w-10 sm:m-auto rounded-md hover:bg-organiser-darker-light-gray transition ease-in-out ${
            currPage === "Metrics" && "bg-organiser-darker-light-gray"
          }`}
        >
          <ChartBarIcon className="w-10 sm:w-6 stroke-1 stroke-organiser-dark-gray-text" />
        </Link>
        <Link
          href="/organiser/gallery"
          className={`flex justify-center self-center h-12 w-12 sm:h-10 sm:w-10 sm:m-auto rounded-md hover:bg-organiser-darker-light-gray transition ease-in-out ${
            currPage === "Gallery" && "bg-organiser-darker-light-gray"
          }`}
        >
          <CameraIcon className="w-10 sm:w-6 stroke-1 stroke-organiser-dark-gray-text" />
        </Link>
        <Link
          href="/organiser/settings"
          className={`flex justify-center self-center h-12 w-12 sm:h-10 sm:w-10 sm:m-auto rounded-md hover:bg-organiser-darker-light-gray transition ease-in-out ${
            currPage === "Settings" && "bg-organiser-darker-light-gray"
          }`}
        >
          <UserIcon className="w-10 sm:w-6 stroke-1 stroke-organiser-dark-gray-text" />
        </Link>
      </div>
    </div>
  );
}
