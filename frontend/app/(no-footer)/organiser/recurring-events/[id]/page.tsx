"use client";

import EventDrilldownBanner from "@/components/organiser/EventDrilldownBanner";
import EventDrilldownCommunicationPage from "@/components/organiser/EventDrilldownCommunicationPage";
import EventDrilldownDetailsPage from "@/components/organiser/EventDrilldownDetailsPage";
import EventDrilldownManageAttendeesPage from "@/components/organiser/EventDrilldownManageAttendeesPage";
import EventDrilldownSharePage from "@/components/organiser/EventDrilldownSharePage";
import EventDrilldownSidePanel from "@/components/organiser/EventDrilldownSidePanel";
import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
import { MobileEventDrilldownNavTabs } from "@/components/organiser/mobile/MobileEventDrilldownNavTabs";
import RecurringTemplateDrilldownSettings from "@/components/organiser/recurring-events/RecurringTemplateDrilldownSettings";
import { EmptyEventMetadata, EventMetadata, NewEventData } from "@/interfaces/EventTypes";
import {
  DEFAULT_RECURRENCE_FORM_DATA,
  NewRecurrenceFormData,
  RecurrenceTemplateId,
} from "@/interfaces/RecurringEventTypes";
import { EmptyUserData } from "@/interfaces/UserTypes";
import { getRecurrenceTemplate } from "@/services/src/recurringEvents/recurringEventsService";
import { sleep } from "@/utilities/sleepUtil";
import { Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface RecurrenceTemplatePageProps {
  params: {
    id: string;
  };
}

//brians
export default function RecurrenceTemplatePage({ params }: RecurrenceTemplatePageProps) {
  const [currSidebarPage, setCurrSidebarPage] = useState("Details");
  const [eventData, setEventData] = useState<NewEventData>();
  const [loading, setLoading] = useState<boolean>(true);
  const [eventName, setEventName] = useState<string>("");
  const [eventStartDate, setEventStartDate] = useState<Timestamp>(Timestamp.now());
  const [eventEndDate, setEventEndDate] = useState<Timestamp>(Timestamp.now());
  const [eventVacancy, setEventVacancy] = useState<number>(0);
  const [eventDescription, setEventDescription] = useState<string>("");
  const [eventLocation, setEventLocation] = useState<string>("");
  const [eventPrice, setEventPrice] = useState<number>(0);
  const [eventImage, setEventImage] = useState<string>("");
  const [eventAccessCount, setEventAccessCount] = useState<number>(0);
  const [eventCapacity, setEventCapacity] = useState<number>(0);
  const [eventMetadata, setEventMetadata] = useState<EventMetadata>(EmptyEventMetadata);

  const router = useRouter();

  const [newRecurrenceData, setNewRecurrenceData] = useState<NewRecurrenceFormData>(DEFAULT_RECURRENCE_FORM_DATA);

  const recurrenceTemplateId: RecurrenceTemplateId = params.id;
  useEffect(() => {
    getRecurrenceTemplate(recurrenceTemplateId)
      .then((recurrenceTemplate) => {
        setEventData(recurrenceTemplate.eventData);
        setEventName(recurrenceTemplate.eventData.name);
        setEventStartDate(recurrenceTemplate.eventData.startDate);
        setEventEndDate(recurrenceTemplate.eventData.endDate);
        setEventVacancy(recurrenceTemplate.eventData.vacancy);
        setEventDescription(recurrenceTemplate.eventData.description);
        setEventLocation(recurrenceTemplate.eventData.location);
        setEventPrice(recurrenceTemplate.eventData.price);
        setEventImage(recurrenceTemplate.eventData.image);
        setEventAccessCount(recurrenceTemplate.eventData.accessCount);
        setEventCapacity(recurrenceTemplate.eventData.capacity);
        setNewRecurrenceData(recurrenceTemplate.recurrenceData);
      })
      .finally(async () => {
        await sleep(500);
        setLoading(false);
      })
      .catch((error) => {
        // dont need to log here as we should have caught all the necessary logs in the service layer
        router.push("/error");
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
        organiser={EmptyUserData}
        vacancy={eventVacancy}
        loading={loading}
      />
      <div className="sm:p-10">
        <RecurringTemplateDrilldownSettings
          loading={loading}
          newRecurrenceData={newRecurrenceData}
          setNewRecurrenceData={setNewRecurrenceData} startDate={eventStartDate}        />
        {/* <EventDrilldownStatBanner
          loading={loading}
          eventAccessCount={eventAccessCount}
          eventVacancy={eventVacancy}
          eventCapacity={eventCapacity}
          eventPrice={eventPrice}
        /> */}
        <MobileEventDrilldownNavTabs currSidebarPage={currSidebarPage} setCurrSidebarPage={setCurrSidebarPage} />
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
                  eventId={""}
                />
              </>
            )}
            {currSidebarPage === "Attendees" && (
              <EventDrilldownManageAttendeesPage
                eventMetadata={eventMetadata}
                eventId={""}
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
