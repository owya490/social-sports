"use client";

import ShareModal from "@/components/events/ShareModal";
import EventDrilldownBanner from "@/components/organiser/EventDrilldownBanner";
import EventDrilldownCommunicationPage from "@/components/organiser/EventDrilldownCommunicationPage";
import EventDrilldownSharePage from "@/components/organiser/EventDrilldownSharePage";
import EventDrilldownSidePanel from "@/components/organiser/EventDrilldownSidePanel";
import EventDrilldownStatBanner from "@/components/organiser/EventDrilldownStatBanner";
import EventDrilldownManageAttendeesPage from "@/components/organiser/event/attendee/EventDrilldownManageAttendeesPage";
import EventDrilldownDetailsPage from "@/components/organiser/event/details/EventDrilldownDetailsPage";
import EventDrilldownFormsPage from "@/components/organiser/event/forms/EventDrilldownFormsPage";
import { EventDrilldownImagesPage } from "@/components/organiser/event/images/EventDrilldownImagesPage";
import EventDrilldownSettingsPage from "@/components/organiser/event/settings/EventDrilldownSettingsPage";
import { MobileEventDrilldownNavTabs } from "@/components/organiser/mobile/MobileEventDrilldownNavTabs";
import { useUser } from "@/components/utility/UserContext";
import { EmptyEventMetadata, EventData, EventId, EventMetadata } from "@/interfaces/EventTypes";
import { FormId } from "@/interfaces/FormTypes";
import { EmptyPublicUserData, PublicUserData } from "@/interfaces/UserTypes";
import { getEventsMetadataByEventId } from "@/services/src/events/eventsMetadata/eventsMetadataService";
import { eventServiceLogger, getEventById, updateEventById } from "@/services/src/events/eventsService";
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
  const [_eventData, setEventData] = useState<EventData>();
  const [loading, setLoading] = useState<boolean>(true);
  const [eventName, setEventName] = useState<string>("");
  const [eventStartDate, setEventStartDate] = useState<Timestamp>(Timestamp.now());
  const [eventEndDate, setEventEndDate] = useState<Timestamp>(Timestamp.now());
  const [eventOrganiser, setEventOrganiser] = useState<PublicUserData>(EmptyPublicUserData);
  const [eventVacancy, setEventVacancy] = useState<number>(0);
  const [eventDescription, setEventDescription] = useState<string>("");
  const [eventLocation, setEventLocation] = useState<string>("");
  const [eventSport, setEventSport] = useState<string>("");
  const [eventPrice, setEventPrice] = useState<number>(0);
  const [eventImage, setEventImage] = useState<string>("");
  const [eventThumbnail, setEventThumbnail] = useState<string>("");
  const [eventAccessCount, setEventAccessCount] = useState<number>(0);
  const [eventCapacity, setEventCapacity] = useState<number>(0);
  const [eventMetadata, setEventMetadata] = useState<EventMetadata>(EmptyEventMetadata);
  const [eventPaused, setEventPaused] = useState<boolean>(false);
  const [eventRegistrationDeadline, setEventRegistrationDeadline] = useState<Timestamp>(Timestamp.now());
  const [eventEventLink, setEventEventLink] = useState<string>("");
  const [eventPaymentsActive, setEventPaymentsActive] = useState<boolean>(false);
  const [eventStripeFeeToCustomer, setEventStripeFeeToCustomer] = useState<boolean>(false);
  const [eventPromotionalCodesEnabled, setEventPromotionalCodesEnabled] = useState<boolean>(false);
  const [eventHideVacancy, setEventHideVacancy] = useState<boolean>(false);
  const [eventIsActive, setEventIsActive] = useState<boolean>(false);
  const [eventFormId, setEventFormId] = useState<FormId | null>(null);
  const router = useRouter();

  const { user } = useUser();

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
        setEventSport(event.sport);
        setEventPrice(event.price);
        setEventImage(event.image);
        setEventThumbnail(event.thumbnail);
        setEventAccessCount(event.accessCount);
        setEventCapacity(event.capacity);
        setEventPaused(event.paused);
        setEventPaymentsActive(event.paymentsActive);
        setEventRegistrationDeadline(event.registrationDeadline);
        setEventEventLink(event.eventLink);
        setEventStripeFeeToCustomer(event.stripeFeeToCustomer);
        setEventPromotionalCodesEnabled(event.promotionalCodesEnabled);
        setEventIsActive(event.isActive);
        setEventFormId(event.formId);
        setEventHideVacancy(event.hideVacancy);
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
    <div className="">
      <EventDrilldownBanner
        name={eventName}
        startDate={eventStartDate}
        organiser={eventOrganiser}
        vacancy={eventVacancy}
        loading={loading}
      />
      <div className="sm:px-10 sm:pb-10">
        <EventDrilldownStatBanner
          loading={loading}
          eventAccessCount={eventAccessCount}
          eventVacancy={eventVacancy}
          eventCapacity={eventCapacity}
          eventPrice={eventPrice}
        />
        <MobileEventDrilldownNavTabs
          navigationTabs={["Details", "Attendees", "Forms", "Images", "Settings"]}
          currSidebarPage={currSidebarPage}
          setCurrSidebarPage={setCurrSidebarPage}
        />
        <div className="flex flex-row md:mt-10 max-w-6xl xl:mx-auto">
          <div id="side-panel" className="z-20">
            <EventDrilldownSidePanel
              loading={loading}
              currSidebarPage={currSidebarPage}
              setCurrSidebarPage={setCurrSidebarPage}
              eventName={eventName}
              eventStartDate={eventStartDate}
              user={user}
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
                  eventSport={eventSport}
                  eventCapacity={eventCapacity}
                  eventVacancy={eventVacancy}
                  eventPrice={eventPrice}
                  eventImage={eventImage}
                  eventId={eventId}
                  eventRegistrationDeadline={eventRegistrationDeadline}
                  eventEventLink={eventEventLink}
                  isActive={eventIsActive}
                  updateData={updateEventById}
                  isRecurrenceTemplate={false}
                  eventFormId={eventFormId}
                />
                <ShareModal eventId={eventId} />
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
            {currSidebarPage === "Forms" && <EventDrilldownFormsPage eventId={eventId} />}
            {currSidebarPage === "Images" && (
              <EventDrilldownImagesPage
                user={user}
                eventId={eventId}
                eventImage={eventImage}
                eventThumbnail={eventThumbnail}
              />
            )}
            {currSidebarPage === "Settings" && (
              <EventDrilldownSettingsPage
                eventMetadata={eventMetadata}
                eventName={eventName}
                eventStartDate={eventStartDate}
                router={router}
                eventId={eventId}
                paused={eventPaused}
                setPaused={setEventPaused}
                paymentsActive={eventPaymentsActive}
                setPaymentsActive={setEventPaymentsActive}
                stripeFeeToCustomer={eventStripeFeeToCustomer}
                setStripeFeeToCustomer={setEventStripeFeeToCustomer}
                promotionalCodesEnabled={eventPromotionalCodesEnabled}
                setPromotionalCodesEnabled={setEventPromotionalCodesEnabled}
                hideVacancy={eventHideVacancy}
                setHideVacancy={setEventHideVacancy}
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
