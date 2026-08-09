"use client";

/**
 * THESIS: Tabs guide the series; Details twins the event hub overview; Past events / Recurrence / Settings are peer work — refuses legacy sidebar drilldown.
 * OWN-WORLD: Honest Clubhouse — surface canvas, Satoshi, 12px radius, yellow only on Save / Update.
 * STORY: Organiser lands on Details (preview, hosts, visibility), edits via panels; schedule and prefs stay peer-findable.
 * FIRST VIEWPORT: Quiet header (← Recurring, title, Template chip, Pause) + peer tabs; Details two-column overview.
 * FORM: Event-hub overview twin; Comp A approved; tabs mirror-plus-series; seed overview-twin.
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
 */

import { EventHubListing } from "@/components/organiser/v2/event-hub/EventHubListing";
import { RecurringHubHeader } from "@/components/organiser/v2/recurring-hub/RecurringHubHeader";
import { RecurringHubNav } from "@/components/organiser/v2/recurring-hub/RecurringHubNav";
import { RecurringHubPastEvents } from "@/components/organiser/v2/recurring-hub/RecurringHubPastEvents";
import { RecurringHubRecurrence } from "@/components/organiser/v2/recurring-hub/RecurringHubRecurrence";
import { RecurringHubSettings } from "@/components/organiser/v2/recurring-hub/RecurringHubSettings";
import { RecurringHubSection } from "@/components/organiser/v2/recurring-hub/recurringHubTypes";
import { useUser } from "@/components/utility/UserContext";
import {
  DEFAULT_MAX_TICKETS_PER_ORDER,
  EventId,
} from "@/interfaces/EventTypes";
import {
  DEFAULT_RECURRENCE_FORM_DATA,
  Frequency,
  NewRecurrenceFormData,
  RecurrenceTemplateId,
} from "@/interfaces/RecurringEventTypes";
import { Logger } from "@/observability/logger";
import { clampMaxTicketsPerTransaction } from "@/services/src/events/eventsUtils/ticketLimits";
import {
  calculateRecurrenceEnded,
  getRecurrenceTemplate,
  updateRecurrenceTemplateEventData,
  updateRecurrenceTemplateRecurrenceData,
} from "@/services/src/recurringEvents/recurringEventsService";
import { extractNewRecurrenceFormDataFromRecurrenceData } from "@/services/src/recurringEvents/recurringEventsUtils";
import { sleep } from "@/utilities/sleepUtil";
import { Timestamp } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const logger = new Logger("RecurringHubV2Page");

export default function OrganiserRecurringHubV2Page() {
  const params = useParams<{ id: string }>();
  const recurrenceTemplateId = params.id as RecurrenceTemplateId;
  const router = useRouter();
  const { user } = useUser();

  const [section, setSection] = useState<RecurringHubSection>("Details");
  const [sectionReady, setSectionReady] = useState(true);
  const [loading, setLoading] = useState(true);
  const [pauseUpdating, setPauseUpdating] = useState(false);
  const [updatingRecurrenceData, setUpdatingRecurrenceData] = useState(false);

  const [eventName, setEventName] = useState("");
  const [eventStartDate, setEventStartDate] = useState<Timestamp>(Timestamp.now());
  const [eventEndDate, setEventEndDate] = useState<Timestamp>(Timestamp.now());
  const [eventVacancy, setEventVacancy] = useState(0);
  const [eventDescription, setEventDescription] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventSport, setEventSport] = useState("");
  const [eventPrice, setEventPrice] = useState(0);
  const [eventImage, setEventImage] = useState("");
  const [eventThumbnail, setEventThumbnail] = useState("");
  const [eventCapacity, setEventCapacity] = useState(0);
  const [eventPaused, setEventPaused] = useState(false);
  const [eventRegistrationDeadline, setEventRegistrationDeadline] = useState<Timestamp>(Timestamp.now());
  const [eventEventLink, setEventEventLink] = useState("");
  const [eventPaymentsActive, setEventPaymentsActive] = useState(false);
  const [eventStripeFeeToCustomer, setEventStripeFeeToCustomer] = useState(true);
  const [eventPromotionalCodesEnabled, setEventPromotionalCodesEnabled] = useState(false);
  const [eventHideVacancy, setEventHideVacancy] = useState(false);
  const [eventWaitlistEnabled, setEventWaitlistEnabled] = useState(true);
  const [eventBookingApprovalEnabled, setEventBookingApprovalEnabled] = useState(false);
  const [eventShowAttendeesOnEventPage, setEventShowAttendeesOnEventPage] = useState(false);
  const [eventMaxTicketsPerTransaction, setEventMaxTicketsPerTransaction] =
    useState(DEFAULT_MAX_TICKETS_PER_ORDER);
  const [eventIsActive, setEventIsActive] = useState(false);
  const [eventIsPrivate, setEventIsPrivate] = useState(false);
  const [frequency, setFrequency] = useState<Frequency>(Frequency.WEEKLY);
  const [pastEvents, setPastEvents] = useState<Record<string, EventId>>({});
  const [recurrenceEnded, setRecurrenceEnded] = useState(false);
  const [newRecurrenceData, setNewRecurrenceData] =
    useState<NewRecurrenceFormData>(DEFAULT_RECURRENCE_FORM_DATA);
  const [originalRecurrenceData, setOriginalRecurrenceData] = useState<NewRecurrenceFormData | null>(
    null
  );
  const [saveNotice, setSaveNotice] = useState<"success" | "error" | null>(null);

  useEffect(() => {
    if (!user.userId) return;

    let isActive = true;

    const load = async () => {
      try {
        const template = await getRecurrenceTemplate(recurrenceTemplateId);
        if (!isActive) return;

        const { eventData, recurrenceData } = template;
        setEventName(eventData.name);
        setEventStartDate(eventData.startDate);
        setEventEndDate(eventData.endDate);
        setEventVacancy(eventData.vacancy);
        setEventDescription(eventData.description);
        setEventLocation(eventData.location);
        setEventSport(eventData.sport);
        setEventPrice(eventData.price);
        setEventImage(eventData.image);
        setEventThumbnail(eventData.thumbnail);
        setEventCapacity(eventData.capacity);
        setEventIsActive(eventData.isActive);
        setEventRegistrationDeadline(eventData.registrationDeadline);
        setEventEventLink(eventData.eventLink);
        setEventPaused(eventData.paused);
        setEventPaymentsActive(eventData.paymentsActive);
        setEventStripeFeeToCustomer(eventData.stripeFeeToCustomer);
        setEventPromotionalCodesEnabled(eventData.promotionalCodesEnabled);
        setEventHideVacancy(eventData.hideVacancy);
        setEventWaitlistEnabled(eventData.waitlistEnabled);
        setEventBookingApprovalEnabled(eventData.bookingApprovalEnabled);
        setEventShowAttendeesOnEventPage(eventData.showAttendeesOnEventPage);
        setEventIsPrivate(eventData.isPrivate);
        setEventMaxTicketsPerTransaction(
          clampMaxTicketsPerTransaction(
            eventData.maxTicketsPerTransaction ?? DEFAULT_MAX_TICKETS_PER_ORDER,
            eventData.capacity
          )
        );

        const formData = extractNewRecurrenceFormDataFromRecurrenceData(recurrenceData);
        setFrequency(recurrenceData.frequency);
        setNewRecurrenceData(formData);
        setOriginalRecurrenceData(JSON.parse(JSON.stringify(formData)));
        setPastEvents(recurrenceData.pastRecurrences || {});

        const ended = calculateRecurrenceEnded(template);
        setRecurrenceEnded(ended);
        if (ended) {
          setNewRecurrenceData({ ...formData, recurrenceEnabled: false });
        }
      } catch (error) {
        if (!isActive) return;
        logger.error(`Failed to load recurrence template ${recurrenceTemplateId}: ${error}`);
        router.push("/error");
      } finally {
        await sleep(400);
        if (isActive) setLoading(false);
      }
    };

    void load();
    return () => {
      isActive = false;
    };
  }, [recurrenceTemplateId, router, user.userId]);

  const handleTogglePause = useCallback(async () => {
    const next = !eventPaused;
    setPauseUpdating(true);
    setEventPaused(next);
    try {
      const success = await updateRecurrenceTemplateEventData(recurrenceTemplateId, { paused: next });
      if (!success) setEventPaused(!next);
    } catch (error) {
      setEventPaused(!next);
      logger.error(`Failed to toggle pause on recurring hub: ${error}`);
    } finally {
      setPauseUpdating(false);
    }
  }, [eventPaused, recurrenceTemplateId]);

  const handleSectionChange = (next: RecurringHubSection) => {
    if (next === section) return;
    setSectionReady(false);
    window.setTimeout(() => {
      setSection(next);
      setSectionReady(true);
    }, 120);
  };

  const submitNewRecurrenceData = async () => {
    setUpdatingRecurrenceData(true);
    setSaveNotice(null);
    try {
      await updateRecurrenceTemplateRecurrenceData(recurrenceTemplateId, newRecurrenceData);
      setOriginalRecurrenceData(JSON.parse(JSON.stringify(newRecurrenceData)));
      setFrequency(newRecurrenceData.frequency);
      setSaveNotice("success");
    } catch (error) {
      logger.error(`Failed to update recurrence data for ${recurrenceTemplateId}: ${error}`);
      setSaveNotice("error");
    } finally {
      setUpdatingRecurrenceData(false);
    }
  };

  const listingEventId = recurrenceTemplateId as unknown as EventId;

  return (
    <div className="min-h-screen bg-surface text-foreground pb-8">
      <div className="bg-background border-b border-border">
        <RecurringHubHeader
          loading={loading}
          name={eventName}
          startDate={eventStartDate}
          location={eventLocation}
          frequency={frequency}
          paused={eventPaused}
          isActive={eventIsActive}
          onTogglePause={handleTogglePause}
          pauseUpdating={pauseUpdating}
        />
        <RecurringHubNav current={section} onChange={handleSectionChange} />
      </div>

      <div
        className={`px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pt-6 sm:pt-8 transition-opacity duration-200 ease-out ${
          sectionReady ? "opacity-100" : "opacity-0"
        }`}
      >
        {section === "Details" && (
          <EventHubListing
            loading={loading}
            eventId={listingEventId}
            eventName={eventName}
            eventStartDate={eventStartDate}
            eventEndDate={eventEndDate}
            eventDescription={eventDescription}
            eventLocation={eventLocation}
            eventSport={eventSport}
            eventCapacity={eventCapacity}
            eventVacancy={eventVacancy}
            eventPrice={eventPrice}
            eventRegistrationDeadline={eventRegistrationDeadline}
            eventEventLink={eventEventLink}
            eventImage={eventImage}
            eventThumbnail={eventThumbnail}
            isActive={eventIsActive}
            isPrivate={eventIsPrivate}
            mode="template"
            updateData={async (id, data) => {
              await updateRecurrenceTemplateEventData(id as unknown as RecurrenceTemplateId, data);
              if (data.name !== undefined) setEventName(data.name);
              if (data.description !== undefined) setEventDescription(data.description);
              if (data.location !== undefined) setEventLocation(data.location);
              if (data.sport !== undefined) setEventSport(data.sport);
              if (data.price !== undefined) setEventPrice(data.price);
              if (data.capacity !== undefined) setEventCapacity(data.capacity);
              if (data.vacancy !== undefined) setEventVacancy(data.vacancy);
              if (data.startDate !== undefined) setEventStartDate(data.startDate);
              if (data.endDate !== undefined) setEventEndDate(data.endDate);
              if (data.registrationDeadline !== undefined) {
                setEventRegistrationDeadline(data.registrationDeadline);
              }
              if (data.eventLink !== undefined) setEventEventLink(data.eventLink);
              if (data.image !== undefined) setEventImage(data.image);
              if (data.thumbnail !== undefined) setEventThumbnail(data.thumbnail);
              if (data.isPrivate !== undefined) setEventIsPrivate(data.isPrivate);
            }}
          />
        )}

        {section === "Past events" && <RecurringHubPastEvents pastEvents={pastEvents} />}

        {section === "Recurrence" && (
          <RecurringHubRecurrence
            loading={loading}
            updating={updatingRecurrenceData}
            newRecurrenceData={newRecurrenceData}
            originalRecurrenceData={originalRecurrenceData}
            setNewRecurrenceData={setNewRecurrenceData}
            startDate={eventStartDate}
            submitNewRecurrenceData={submitNewRecurrenceData}
            isRecurrenceEnded={recurrenceEnded}
            capacity={eventCapacity}
          />
        )}

        {section === "Settings" && (
          <RecurringHubSettings
            recurrenceTemplateId={recurrenceTemplateId}
            paymentsActive={eventPaymentsActive}
            setPaymentsActive={setEventPaymentsActive}
            stripeFeeToCustomer={eventStripeFeeToCustomer}
            setStripeFeeToCustomer={setEventStripeFeeToCustomer}
            promotionalCodesEnabled={eventPromotionalCodesEnabled}
            setPromotionalCodesEnabled={setEventPromotionalCodesEnabled}
            hideVacancy={eventHideVacancy}
            setHideVacancy={setEventHideVacancy}
            waitlistEnabled={eventWaitlistEnabled}
            setWaitlistEnabled={setEventWaitlistEnabled}
            bookingApprovalEnabled={eventBookingApprovalEnabled}
            setBookingApprovalEnabled={setEventBookingApprovalEnabled}
            showAttendeesOnEventPage={eventShowAttendeesOnEventPage}
            setShowAttendeesOnEventPage={setEventShowAttendeesOnEventPage}
            maxTicketsPerTransaction={eventMaxTicketsPerTransaction}
            setMaxTicketsPerTransaction={setEventMaxTicketsPerTransaction}
            eventCapacity={eventCapacity}
            eventPrice={eventPrice}
          />
        )}
      </div>

      {saveNotice ? (
        <div
          role="status"
          className={`fixed left-4 bottom-4 z-40 rounded-xl border px-4 py-3 text-sm font-sans shadow-sm ${
            saveNotice === "success"
              ? "border-border bg-background text-foreground"
              : "border-danger/30 bg-background text-danger"
          }`}
        >
          {saveNotice === "success"
            ? "Recurrence settings saved."
            : "Failed to save recurrence settings. Try again."}
          <button
            type="button"
            className="ml-3 text-xs text-foreground-muted hover:text-foreground"
            onClick={() => setSaveNotice(null)}
          >
            Dismiss
          </button>
        </div>
      ) : null}
    </div>
  );
}
