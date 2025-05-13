"use client";

import EventDrilldownDetailsPage from "@/components/organiser/event/details/EventDrilldownDetailsPage";
import EventDrilldownBanner from "@/components/organiser/EventDrilldownBanner";
import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
import RecurringTemplateDrilldownSettings from "@/components/organiser/recurring-events/RecurringTemplateDrilldownSettings";
import RecurringTemplateDrilldownSidePanel from "@/components/organiser/recurring-events/RecurringTemplateDrilldownSidePanel";
import { RecurringTemplatePastEvents } from "@/components/organiser/recurring-events/RecurringTemplatePastEvents";
import { RecurringTemplateSettings } from "@/components/organiser/recurring-events/RecurringTemplateSettings";
import { EventId, NewEventData } from "@/interfaces/EventTypes";
import {
  DEFAULT_RECURRENCE_FORM_DATA,
  NewRecurrenceFormData,
  RecurrenceTemplateId,
} from "@/interfaces/RecurringEventTypes";
import { EmptyPublicUserData } from "@/interfaces/UserTypes";
import {
  calculateRecurrenceEnded,
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
  const [_eventData, setEventData] = useState<NewEventData>();
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingRecurrenceData, setUpdatingRecurrenceData] = useState<boolean>(false);
  const [eventName, setEventName] = useState<string>("");
  const [eventStartDate, setEventStartDate] = useState<Timestamp>(Timestamp.now());
  const [eventEndDate, setEventEndDate] = useState<Timestamp>(Timestamp.now());
  const [eventVacancy, setEventVacancy] = useState<number>(0);
  const [eventDescription, setEventDescription] = useState<string>("");
  const [eventSport, setEventSport] = useState<string>("");
  const [eventLocation, setEventLocation] = useState<string>("");
  const [eventPrice, setEventPrice] = useState<number>(0);
  const [eventImage, setEventImage] = useState<string>("");
  const [_eventAccessCount, setEventAccessCount] = useState<number>(0);
  const [eventCapacity, setEventCapacity] = useState<number>(0);
  const [eventRegistrationDeadline, setEventRegistrationDeadline] = useState<Timestamp>(Timestamp.now());
  const [eventEventLink, setEventEventLink] = useState<string>("");
  const [eventIsActive, setEventIsActive] = useState<boolean>(false);
  const [_eventPaused, seteventPaused] = useState<boolean>(false);
  const [eventPaymentsActive, setEventPaymentsActive] = useState<boolean>(false);
  const [eventStripeFeeToCustomer, setEventStripeFeeToCustomer] = useState<boolean>(false);
  const [eventPromotionalCodesEnabled, setEventPromotionalCodesEnabled] = useState<boolean>(false);
  const [pastEvents, setPastEvents] = useState<Record<number, EventId>>({});
  const [recurrenceEnded, setRecurrenceEnded] = useState<boolean>(false);

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
        setEventSport(recurrenceTemplate.eventData.sport);
        setEventPrice(recurrenceTemplate.eventData.price);
        setEventImage(recurrenceTemplate.eventData.image);
        setEventAccessCount(recurrenceTemplate.eventData.accessCount);
        setEventCapacity(recurrenceTemplate.eventData.capacity);
        setEventIsActive(recurrenceTemplate.eventData.isActive);
        setEventRegistrationDeadline(recurrenceTemplate.eventData.registrationDeadline);
        setEventEventLink(recurrenceTemplate.eventData.eventLink);
        const newRecurrenceData = extractNewRecurrenceFormDataFromRecurrenceData(recurrenceTemplate.recurrenceData);
        setNewRecurrenceData(newRecurrenceData);
        setPastEvents(recurrenceTemplate.recurrenceData.pastRecurrences);
        seteventPaused(recurrenceTemplate.eventData.paused);
        setEventPaymentsActive(recurrenceTemplate.eventData.paymentsActive);
        setEventStripeFeeToCustomer(recurrenceTemplate.eventData.stripeFeeToCustomer);
        setEventPromotionalCodesEnabled(recurrenceTemplate.eventData.promotionalCodesEnabled);
        const isRecurrenceEnded = calculateRecurrenceEnded(recurrenceTemplate);
        setRecurrenceEnded(isRecurrenceEnded);
        // Edge case, if the recurrence is ended, it should not be enabled
        if (isRecurrenceEnded) {
          setNewRecurrenceData({
            ...newRecurrenceData,
            recurrenceEnabled: false,
          });
        }
      })
      .finally(async () => {
        await sleep(500);
        setLoading(false);
      })
      .catch((_error) => {
        // dont need to log here as we should have caught all the necessary logs in the service layer
        router.push("/error");
      });
  }, []);

  const submitNewRecurrenceData = async () => {
    setUpdatingRecurrenceData(true);
    await updateRecurrenceTemplateRecurrenceData(recurrenceTemplateId, newRecurrenceData);
    setUpdatingRecurrenceData(false);
  };

  return (
    <div className="sm:ml-14 mt-14">
      <OrganiserNavbar currPage="EventDrilldown" />
      <EventDrilldownBanner
        name={eventName}
        startDate={eventStartDate}
        organiser={EmptyPublicUserData}
        vacancy={eventVacancy}
        loading={loading}
      />
      <div className="sm:px-10 sm:pb-10">
        <RecurringTemplateDrilldownSettings
          loading={loading}
          updating={updatingRecurrenceData}
          newRecurrenceData={newRecurrenceData}
          setNewRecurrenceData={setNewRecurrenceData}
          startDate={eventStartDate}
          submitNewRecurrenceData={submitNewRecurrenceData}
          isRecurrenceEnded={recurrenceEnded}
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
                  eventSport={eventSport}
                  eventCapacity={eventCapacity}
                  eventVacancy={eventVacancy}
                  eventPrice={eventPrice}
                  eventImage={eventImage}
                  eventId={recurrenceTemplateId}
                  isActive={eventIsActive}
                  eventRegistrationDeadline={eventRegistrationDeadline}
                  eventEventLink={eventEventLink}
                  updateData={updateRecurrenceTemplateEventData}
                  isRecurrenceTemplate={true}
                />
              </>
            )}
            {currSidebarPage === "PastEvents" && (
              <>
                <RecurringTemplatePastEvents pastEvents={pastEvents} />
              </>
            )}
            {currSidebarPage === "Settings" && (
              <>
                <RecurringTemplateSettings
                  recurrenceTemplateId={recurrenceTemplateId}
                  paymentsActive={eventPaymentsActive}
                  setPaymentsActive={setEventPaymentsActive}
                  stripeFeeToCustomer={eventStripeFeeToCustomer}
                  setStripeFeeToCustomer={setEventStripeFeeToCustomer}
                  promotionalCodesEnabled={eventPromotionalCodesEnabled}
                  setPromotionalCodesEnabled={setEventPromotionalCodesEnabled}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
