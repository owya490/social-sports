"use client";

import EventDrilldownBanner from "@/components/organiser/EventDrilldownBanner";
import EventDrilldownCommunicationPage from "@/components/organiser/EventDrilldownCommunicationPage";
import EventDrilldownDetailsPage from "@/components/organiser/EventDrilldownDetailsPage";
import EventDrilldownManageAttendeesPage from "@/components/organiser/EventDrilldownManageAttendeesPage";
import EventDrilldownSharePage from "@/components/organiser/EventDrilldownSharePage";
import EventDrilldownSidePanel from "@/components/organiser/EventDrilldownSidePanel";
import EventDrilldownStatBanner from "@/components/organiser/EventDrilldownStatBanner";
import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
import { EventAttendees, EventAttendeesMetadata, EventData, EventId } from "@/interfaces/EventTypes";
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
  const [eventDuration, setEventDuration] = useState<number[]>([]);
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
  const [eventAttendeesNumTickets, setEventAttendeesNumTickets] = useState<EventAttendees>({});
  const [eventAttendeesMetadata, setEventAttendeesMetadata] = useState<EventAttendeesMetadata>({});

  const router = useRouter();

  const eventId: EventId = params.id;
  useEffect(() => {
    getEventById(eventId)
      .then((event) => {
        setEventData(event);
        setEventName(event.name);
        setEventStartDate(event.startDate);
        const { hrs, mins } = event.duration;
        const durationArray: number[] = [hrs, mins];
        setEventDuration(durationArray);
        setEventOrganiser(event.organiser);
        setEventVacancy(event.vacancy);
        setEventDescription(event.description);
        setEventLocation(event.location);
        setEventPrice(event.price);
        setEventImage(event.image);
        setEventAccessCount(event.accessCount);
        setEventCapacity(event.capacity);
        setEventAttendeesNumTickets(event.attendees);
        setEventAttendeesMetadata(event.attendeesMetadata);
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

  useEffect(() => {
    window.onscroll = () => {
      if (window.scrollY > 310) {
        document.getElementById("side-panel")!.classList.add("fixed");
        document.getElementById("side-panel")!.classList.add("top-[110px]");
        document.getElementById("event-drilldown-details-page")!.classList.add("ml-[296px]");
      } else if (window.scrollY <= 310) {
        document.getElementById("side-panel")!.classList.remove("fixed");
        document.getElementById("side-panel")!.classList.remove("top-[110px]");
        document.getElementById("event-drilldown-details-page")!.classList.remove("ml-[296px]");
      }
    };

    return () => {
      window.onscroll = null;
    };
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
          <div id="side-panel" className="z-20">
            <EventDrilldownSidePanel
              loading={loading}
              currSidebarPage={currSidebarPage}
              setCurrSidebarPage={setCurrSidebarPage}
              eventName={eventName}
              eventStartDate={eventStartDate}
            />
          </div>
          <div id="event-drilldown-details-page" className="w-full mx-20">
            {currSidebarPage === "Details" && (
              <EventDrilldownDetailsPage
                loading={loading}
                eventName={eventName}
                eventStartdate={eventStartDate}
                eventDescription={eventDescription}
                eventLocation={eventLocation}
                eventPrice={eventPrice}
                eventImage={eventImage}
                eventId={eventId}
                eventDuration={{
                  hrs: eventDuration[0],
                  mins: eventDuration[1],
                }}
              />
            )}
            {currSidebarPage === "Manage Attendees" && (
              <EventDrilldownManageAttendeesPage
                eventAttendeesNumTickets={eventAttendeesNumTickets}
                eventAttendeesMetadata={eventAttendeesMetadata}
              />
            )}
            {currSidebarPage === "Communication" && <EventDrilldownCommunicationPage />}
            {currSidebarPage === "Share" && <EventDrilldownSharePage />}
          </div>
        </div>
      </div>
    </div>
  );
}
