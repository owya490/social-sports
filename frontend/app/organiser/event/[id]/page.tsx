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
import { useRouter } from "next/navigation";
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
  const [eventDescription, setEventDescription] = useState<string>("");
  const [eventLocation, setEventLocation] = useState<string>("");
  const [eventPrice, setEventPrice] = useState<number>(0);
  const [eventImage, setEventImage] = useState<string>("");
  const [eventAccessCount, setEventAccessCount] = useState<number>(0);
  const [eventCapacity, setEventCapacity] = useState<number>(0);

  const router = useRouter();

  const eventId: EventId = params.id;
  useEffect(() => {
    getEventById(eventId)
      .then((event) => {
        setEventData(event);
        setEventName(event.name);
        setEventStartDate(event.startDate);
        setEventOrganiser(event.organiser);
        setEventVacancy(event.vacancy);
        setEventDescription(event.description);
        setEventLocation(event.location);
        setEventPrice(event.price);
        setEventImage(event.image);
        setEventAccessCount(event.accessCount);
        setEventCapacity(event.capacity);
      })
      .finally(async () => {
        await sleep(500);
        setLoading(false);
      })
      .catch((error) => {
        eventServiceLogger.error(`Error fetching event by eventId for organiser event drilldown: ${error}`);
        router.push("/error");
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
        <EventDrilldownStatBanner
          loading={loading}
          eventAccessCount={eventAccessCount}
          eventVacancy={eventVacancy}
          eventCapacity={eventCapacity}
          eventPrice={eventPrice}
        />
        <div className="flex flex-row mt-10 max-w-6xl xl:mx-auto">
          <div>
            <EventDrilldownSidePanel
              loading={loading}
              currSidebarPage={currSidebarPage}
              setCurrSidebarPage={setCurrSidebarPage}
              eventName={eventName}
              eventStartDate={eventStartDate}
            />
          </div>
          <div className="mx-auto w-full mx-20">
            {currSidebarPage === "Details" && (
              <EventDrilldownDetailsPage
                loading={loading}
                eventName={eventName}
                eventStartdate={eventStartDate}
                eventDescription={eventDescription}
                eventLocation={eventLocation}
                eventPrice={eventPrice}
                eventImage={eventImage}
              />
            )}
            {currSidebarPage === "Manage Attendees" && <EventDrilldownManageAttendeesPage />}
            {currSidebarPage === "Communication" && <EventDrilldownCommunicationPage />}
            {currSidebarPage === "Share" && <EventDrilldownSharePage />}
          </div>
        </div>
      </div>
    </div>
  );
}
