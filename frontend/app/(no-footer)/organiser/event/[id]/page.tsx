"use client";

import ShareModal from "@/components/events/ShareModal";
import EventDrilldownBanner from "@/components/organiser/EventDrilldownBanner";
import EventDrilldownCommunicationPage from "@/components/organiser/EventDrilldownCommunicationPage";
import EventDrilldownDetailsPage from "@/components/organiser/EventDrilldownDetailsPage";
import EventDrilldownManageAttendeesPage from "@/components/organiser/EventDrilldownManageAttendeesPage";
import EventDrilldownSharePage from "@/components/organiser/EventDrilldownSharePage";
import EventDrilldownSidePanel from "@/components/organiser/EventDrilldownSidePanel";
import EventDrilldownStatBanner from "@/components/organiser/EventDrilldownStatBanner";
import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
import { EmptyEventMetadata, EventData, EventId, EventMetadata } from "@/interfaces/EventTypes";
import { EmptyUserData, UserData } from "@/interfaces/UserTypes";
import { getEventsMetadataByEventId } from "@/services/src/events/eventsMetadata/eventsMetadataService";
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
  const [eventEndDate, setEventEndDate] = useState<Timestamp>(Timestamp.now());
  const [eventOrganiser, setEventOrganiser] = useState<UserData>(EmptyUserData);
  const [eventVacancy, setEventVacancy] = useState<number>(0);
  const [eventDescription, setEventDescription] = useState<string>("");
  const [eventLocation, setEventLocation] = useState<string>("");
  const [eventPrice, setEventPrice] = useState<number>(0);
  const [eventImage, setEventImage] = useState<string>("");
  const [eventAccessCount, setEventAccessCount] = useState<number>(0);
  const [eventCapacity, setEventCapacity] = useState<number>(0);
  const [eventMetadata, setEventMetadata] = useState<EventMetadata>(EmptyEventMetadata);

  const router = useRouter();

  const eventId: EventId = params.id;
  useEffect(() => {
    getEventById(eventId)
      .then((event) => {
        setEventData(event);
        setEventName(event.name);
        setEventStartDate(event.startDate);
        setEventEndDate(event.endDate);
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
    getEventsMetadataByEventId(eventId).then((eventMetadata) => {
      setEventMetadata(eventMetadata);
    });
  }, []);

  useEffect(() => {
    window.onscroll = () => {
      // Prevent side panel on small screen as its doesn't exist
      if (window.innerWidth > 640) {
        if (window.scrollY > 310) {
          document.getElementById("side-panel")!.classList.add("fixed");
          document.getElementById("side-panel")!.classList.add("top-[110px]");
          document.getElementById("event-drilldown-details-page")!.classList.add("ml-[296px]");
        } else if (window.scrollY <= 310) {
          document.getElementById("side-panel")!.classList.remove("fixed");
          document.getElementById("side-panel")!.classList.remove("top-[110px]");
          document.getElementById("event-drilldown-details-page")!.classList.remove("ml-[296px]");
        }
      }
    };

    return () => {
      window.onscroll = null;
    };
  }, []);

  return (
    <div className="sm:ml-14 mt-16">
      <OrganiserNavbar currPage="EventDrilldown" />
      <EventDrilldownBanner
        name={eventName}
        startDate={eventStartDate}
        organiser={eventOrganiser}
        vacancy={eventVacancy}
        loading={loading}
      />
      <div className="sm:p-10">
        <EventDrilldownStatBanner
          loading={loading}
          eventAccessCount={eventAccessCount}
          eventVacancy={eventVacancy}
          eventCapacity={eventCapacity}
          eventPrice={eventPrice}
        />
        <div className="flex sm:hidden">
          {["Details", "Attendees"].map((tab) => {
            return (
              <button
                className={`px-2 py-2 text-center overflow-hidden rounded-xl text-xs basis-1/2 ${
                  currSidebarPage === tab ? "bg-gray-300" : ""
                }`}
                onClick={() => {
                  setCurrSidebarPage(tab);
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>

        <div className="flex flex-row md:mt-10 max-w-6xl xl:mx-auto">
          <div id="side-panel" className="z-20">
            <EventDrilldownSidePanel
              loading={loading}
              currSidebarPage={currSidebarPage}
              setCurrSidebarPage={setCurrSidebarPage}
              eventName={eventName}
              eventStartDate={eventStartDate}
            />
          </div>
          <div id="event-drilldown-details-page" className="w-full mb-20 sm:mb-0">
            {currSidebarPage === "Details" && (
              <>
                <EventDrilldownDetailsPage
                  loading={loading}
                  eventName={eventName}
                  eventStartDate={eventStartDate}
                  eventEndDate={eventEndDate}
                  eventDescription={eventDescription}
                  eventLocation={eventLocation}
                  eventPrice={eventPrice}
                  eventImage={eventImage}
                  eventId={eventId}
                />
                <ShareModal />
              </>
            )}
            {currSidebarPage === "Attendees" && (
              <EventDrilldownManageAttendeesPage
                eventMetadata={eventMetadata}
                eventId={eventId}
                setEventVacancy={setEventVacancy}
                setEventMetadata={setEventMetadata}
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
