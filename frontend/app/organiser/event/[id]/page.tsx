"use client";

import EventBanner from "@/components/events/EventBanner";
import EventDrilldownCommunicationPage from "@/components/organiser/EventDrilldownCommunicationPage";
import EventDrilldownDetailsPage from "@/components/organiser/EventDrilldownDetailsPage";
import EventDrilldownManageAttendeesPage from "@/components/organiser/EventDrilldownManageAttendeesPage";
import EventDrilldownSharePage from "@/components/organiser/EventDrilldownSharePage";
import EventDrilldownSidePanel from "@/components/organiser/EventDrilldownSidePanel";
import EventDrilldownStatBanner from "@/components/organiser/EventDrilldownStatBanner";
import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
import { Timestamp } from "firebase/firestore";
import { useState } from "react";

//brians
export default function EventPage() {
  const [currSidebarPage, setCurrSidebarPage] = useState("Details");

  return (
    <div className="ml-14 mt-16">
      <OrganiserNavbar />
      <EventBanner name={"Volleyball World Cup"} startDate={Timestamp.now()} organiser={""} vacancy={3} />
      <EventDrilldownStatBanner />
      <div className="flex flex-row">
        <div>
          <EventDrilldownSidePanel setCurrSidebarPage={setCurrSidebarPage} />
        </div>
        <div className="mx-auto w-full mx-20">
          {currSidebarPage === "Details" && <EventDrilldownDetailsPage />}
          {currSidebarPage === "Manage Attendees" && <EventDrilldownManageAttendeesPage />}
          {currSidebarPage === "Communication" && <EventDrilldownCommunicationPage />}
          {currSidebarPage === "Share" && <EventDrilldownSharePage />}
        </div>
      </div>
    </div>
  );
}
