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
        <Link href="/organiser/event/dashboard">
          <div
            className={`flex justify-center h-10 w-10 m-auto rounded-md hover:bg-organiser-darker-light-gray transition ease-in-out ${
              currPage === "EventDashboard" && "bg-organiser-darker-light-gray"
            }`}
          >
            <CalendarIcon className="w-6 stroke-1 stroke-organiser-dark-gray-text" />
          </div>
        </Link>
        <Link href={`/${eventId}`}>
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
        <Link href="/organiser/gallery">
          <div
            className={`flex justify-center h-10 w-10 m-auto rounded-md hover:bg-organiser-darker-light-gray transition ease-in-out ${
              currPage === "Gallery" && "bg-organiser-darker-light-gray"
            }`}
          >
            <CameraIcon className="w-6 stroke-1 stroke-organiser-dark-gray-text" />
          </div>
        </Link>
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
