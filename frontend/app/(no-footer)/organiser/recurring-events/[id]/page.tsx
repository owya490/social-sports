"use client";

import EventDrilldownBanner from "@/components/organiser/EventDrilldownBanner";
import EventDrilldownDetailsPage from "@/components/organiser/EventDrilldownDetailsPage";
import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
import RecurringTemplateDrilldownSettings from "@/components/organiser/recurring-events/RecurringTemplateDrilldownSettings";
import RecurringTemplateDrilldownSidePanel from "@/components/organiser/recurring-events/RecurringTemplateDrilldownSidePanel";
import { RecurringTemplatePastEvents } from "@/components/organiser/recurring-events/RecurringTemplatePastEvents";
import { EmptyEventMetadata, EventId, EventMetadata, NewEventData } from "@/interfaces/EventTypes";
import {
  DEFAULT_RECURRENCE_FORM_DATA,
  NewRecurrenceFormData,
  RecurrenceTemplateId,
} from "@/interfaces/RecurringEventTypes";
import { EmptyUserData } from "@/interfaces/UserTypes";
import {
  getRecurrenceTemplate,
  updateRecurrenceTemplateEventData,
  updateRecurrenceTemplateRecurrenceData,
} from "@/services/src/recurringEvents/recurringEventsService";
import { extractNewRecurrenceFormDataFromRecurrenceData } from "@/services/src/recurringEvents/recurringEventsUtils";
import { sleep } from "@/utilities/sleepUtil";
import { Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface RecurrenceTemplatePageProps {
  params: {
    id: string;
  };
}

export default function RecurrenceTemplatePage({ params }: RecurrenceTemplatePageProps) {
  const [currSidebarPage, setCurrSidebarPage] = useState("Details");
  const [eventData, setEventData] = useState<NewEventData>();
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingRecurrenceData, setUpdatingRecurrenceData] = useState<boolean>(false);
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
  const [pastEvents, setPastEvents] = useState<Record<number, EventId>>({});

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
        setNewRecurrenceData(extractNewRecurrenceFormDataFromRecurrenceData(recurrenceTemplate.recurrenceData));
        setPastEvents(recurrenceTemplate.recurrenceData.pastRecurrences);
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

  const handleRecurrenceTemplateEventUpdate = async (
    recurrenceTemplateId: RecurrenceTemplateId,
    newEventData: Partial<NewEventData>
  ) => {
    await updateRecurrenceTemplateEventData(recurrenceTemplateId, newEventData);
  };

  const submitNewRecurrenceData = async () => {
    setUpdatingRecurrenceData(true);
    await updateRecurrenceTemplateRecurrenceData(recurrenceTemplateId, newRecurrenceData);
    setUpdatingRecurrenceData(false);
  };

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
          updating={updatingRecurrenceData}
          newRecurrenceData={newRecurrenceData}
          setNewRecurrenceData={setNewRecurrenceData}
          startDate={eventStartDate}
          submitNewRecurrenceData={submitNewRecurrenceData}
        />
        <div className="flex flex-row md:mt-10 max-w-6xl xl:mx-auto">
          <div id="side-panel" className="z-20">
            <RecurringTemplateDrilldownSidePanel
              loading={false}
              currSidebarPage={currSidebarPage}
              setCurrSidebarPage={setCurrSidebarPage}
              eventName={eventName}
              recurrenceTemplateId={recurrenceTemplateId}
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
                  eventId={recurrenceTemplateId}
                  updateData={handleRecurrenceTemplateEventUpdate}
                />
              </>
            )}
            {currSidebarPage === "PastEvents" && (
              <>
                <RecurringTemplatePastEvents pastEvents={pastEvents} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
