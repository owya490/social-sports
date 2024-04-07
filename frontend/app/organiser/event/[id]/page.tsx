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
import { UserData } from "@/interfaces/UserTypes";
import { eventServiceLogger, getEventById } from "@/services/src/events/eventsService";
import { sleep } from "@/utilities/sleepUtil";
import { Timestamp } from "firebase/firestore";
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
  const [loading, setLoading] = useState<boolean>(true);

  const [eventName, setEventName] = useState<string>("");
  const [eventStartDate, setEventStartDate] = useState<Timestamp>(Timestamp.now());
  let dummyUserData: UserData = {
    userId: "",
    firstName: "",
    surname: "",
    profilePicture: "",
    contactInformation: {
      email: "dummy_email",
    },
  };
  const [eventOrganiser, setEventOrganiser] = useState<UserData>(dummyUserData);
  const [eventVacancy, setEventVacancy] = useState<number>(0);

  const eventId: EventId = params.id;
  useEffect(() => {
    getEventById(eventId)
      .then((event) => {
        setEventData(event);
        setEventName(event.name);
        setEventStartDate(event.startDate);
        setEventOrganiser(event.organiser);
        setEventVacancy(event.vacancy);
      })
      .finally(async () => {
        await sleep(500);
        setLoading(false);
      })
      .catch((error) => {
        eventServiceLogger.error(`Error fetching event by eventId for organiser event drilldown: ${error}`);
      });
  }, []);

  return (
    <div className="ml-14 mt-16">
      <OrganiserNavbar currPage="EventDrilldown" />
      <EventDrilldownBanner
        name={eventName}
        startDate={eventStartDate}
        organiser={eventOrganiser}
        vacancy={eventVacancy}
        loading={loading}
      />
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
