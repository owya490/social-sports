"use client";

import EventDrilldownBanner from "@/components/organiser/EventDrilldownBanner";
import EventDrilldownDetailsPage from "@/components/organiser/EventDrilldownDetailsPage";
import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
import RecurringTemplateDrilldownSettings from "@/components/organiser/recurring-events/RecurringTemplateDrilldownSettings";
import { EmptyEventMetadata, EventMetadata, NewEventData } from "@/interfaces/EventTypes";
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
        setNewRecurrenceData(extractNewRecurrenceFormDataFromRecurrenceData(recurrenceTemplate.recurrenceData));
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

  // useEffect(() => {
  //   const tmp = async () => {
  //     const event = await getEventById("8z4VmrOcOaElmkVKESeR");

  //     handleRecurrenceTemplateEventUpdate("VKUNc06rWB7fQdn05jG1", event);
  //   };
  //   tmp();
  // }, []);

  const handleRecurrenceTemplateEventUpdate = async (
    recurrenceTemplateId: RecurrenceTemplateId,
    newEventData: Partial<NewEventData>
  ) => {
    await updateRecurrenceTemplateEventData(recurrenceTemplateId, newEventData);
  };

  const submitNewRecurrenceData = async () => {
    await updateRecurrenceTemplateRecurrenceData(recurrenceTemplateId, newRecurrenceData);
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
          recurrenceTemplateId={recurrenceTemplateId}
          newRecurrenceData={newRecurrenceData}
          setNewRecurrenceData={setNewRecurrenceData}
          startDate={eventStartDate}
          submitNewRecurrenceData={submitNewRecurrenceData}
        />
        <div className="flex flex-row md:mt-10 max-w-6xl xl:mx-auto">
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
          </div>
        </div>
      </div>
    </div>
  );
}
