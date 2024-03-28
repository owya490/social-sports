"use client";

import EventDrilldownBanner from "@/components/organiser/EventDrilldownBanner";
import EventDrilldownCommunicationPage from "@/components/organiser/EventDrilldownCommunicationPage";
import EventDrilldownDetailsPage from "@/components/organiser/EventDrilldownDetailsPage";
import EventDrilldownManageAttendeesPage from "@/components/organiser/EventDrilldownManageAttendeesPage";
import EventDrilldownSharePage from "@/components/organiser/EventDrilldownSharePage";
import EventDrilldownSidePanel from "@/components/organiser/EventDrilldownSidePanel";
import EventDrilldownStatBanner from "@/components/organiser/EventDrilldownStatBanner";
import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
import { EventData, EventId } from "@/interfaces/EventTypes";
import { eventServiceLogger, getEventById } from "@/services/src/events/eventsService";
import { Timestamp } from "firebase/firestore";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

interface EventPageProps {
  params: {
    id: string;
  };
}

//brians
export default function EventPage({ params }: EventPageProps) {
  const [currSidebarPage, setCurrSidebarPage] = useState("Details");
  const [eventData, setEventData] = useState<EventData>();

  const eventId: EventId = params.id;
  useEffect(() => {
    getEventById(eventId)
      .then((event) => setEventData(event))
      .catch((error) => {
        console.log("error:", error);
        eventServiceLogger.error(`Error fetching event by eventId for organiser event drilldown: ${error}`);
      });
  }, []);

  return (
    <div className="ml-14 mt-16">
      <OrganiserNavbar currPage="EventDrilldown" />
      <EventDrilldownBanner name={"Volleyball World Cup"} startDate={Timestamp.now()} organiser={""} vacancy={3} />
      <div className="p-10">
        <EventDrilldownStatBanner />
        <div className="flex flex-row mt-10 max-w-6xl xl:mx-auto">
          <div>
            <EventDrilldownSidePanel currSidebarPage={currSidebarPage} setCurrSidebarPage={setCurrSidebarPage} />
          </div>
          <div className="mx-auto w-full mx-20">
            {currSidebarPage === "Details" && <EventDrilldownDetailsPage />}
            {currSidebarPage === "Manage Attendees" && <EventDrilldownManageAttendeesPage />}
            {currSidebarPage === "Communication" && <EventDrilldownCommunicationPage />}
            {currSidebarPage === "Share" && <EventDrilldownSharePage />}
          </div>
        </div>
      </div>
    </div>
  );
}
