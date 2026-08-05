"use client";

/**
 * THESIS: Continuous workbench under chrome—flush lists + expand-in-place; refuses nested card stacks and 1D panels.
 * OWN-WORLD: Honest Clubhouse v2—surface canvas, Satoshi, hairline dividers, yellow only on primary actions.
 * STORY: Organiser opens a session, manages who's coming on an edge-to-edge plane, then edits details side-by-side.
 * FIRST VIEWPORT: Chrome (approved B) + peer tabs; Attendees filters with inline Add; expand inspector.
 * FORM: Continuous workbench A+B (flush list + inspector); chrome-led seed 2cd7ba31; body comps A+B approved.
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
 */

import { EventHubAttendees } from "@/components/organiser/v2/event-hub/EventHubAttendees";
import { EventHubChrome } from "@/components/organiser/v2/event-hub/EventHubChrome";
import { EventHubForms } from "@/components/organiser/v2/event-hub/EventHubForms";
import { EventHubImages } from "@/components/organiser/v2/event-hub/EventHubImages";
import { EventHubListing } from "@/components/organiser/v2/event-hub/EventHubListing";
import { EventHubNav } from "@/components/organiser/v2/event-hub/EventHubNav";
import { EventHubSettings } from "@/components/organiser/v2/event-hub/EventHubSettings";
import { EventHubSection } from "@/components/organiser/v2/event-hub/eventHubTypes";
import { useUser } from "@/components/utility/UserContext";
import {
  EmptyEventData,
  EmptyEventMetadata,
  EventData,
  EventId,
  EventMetadata,
  DEFAULT_MAX_TICKETS_PER_ORDER,
} from "@/interfaces/EventTypes";
import { FormId } from "@/interfaces/FormTypes";
import { Order } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { getEventsMetadataByEventId } from "@/services/src/events/eventsMetadata/eventsMetadataService";
import { eventServiceLogger, getEventById, updateEventById } from "@/services/src/events/eventsService";
import { bustEventsLocalStorageCache } from "@/services/src/events/eventsUtils/getEventsUtils";
import { clampMaxTicketsPerTransaction } from "@/services/src/events/eventsUtils/ticketLimits";
import { getOrdersByIds } from "@/services/src/tickets/orderService";
import { getTicketsByIds } from "@/services/src/tickets/ticketService";
import { calculateNetSales } from "@/services/src/tickets/ticketUtils/ticketUtils";
import { sleep } from "@/utilities/sleepUtil";
import { Timestamp } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function OrganiserEventHubV2Page() {
  const params = useParams<{ id: string }>();
  const eventId = params.id as EventId;
  const router = useRouter();
  const { user } = useUser();

  const [section, setSection] = useState<EventHubSection>("Attendees");
  const [sectionReady, setSectionReady] = useState(true);
  const [eventData, setEventData] = useState<EventData>(EmptyEventData);
  const [loading, setLoading] = useState(true);
  const [pauseUpdating, setPauseUpdating] = useState(false);

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
  const [eventMetadata, setEventMetadata] = useState<EventMetadata>(EmptyEventMetadata);
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
  const [eventFormId, setEventFormId] = useState<FormId | null>(null);
  const [orderTicketsMap, setOrderTicketsMap] = useState<Map<Order, Ticket[]>>(new Map());

  useEffect(() => {
    if (!user.userId) return;

    let isActive = true;

    const fetchEvent = async () => {
      try {
        const event = await getEventById(eventId);
        if (!isActive) return;

        if (event.organiserId !== user.userId) {
          router.push("/organiser/v2/dashboard");
          return;
        }

        setEventData(event);
        setEventName(event.name);
        setEventStartDate(event.startDate);
        setEventEndDate(event.endDate);
        setEventVacancy(event.vacancy);
        setEventDescription(event.description);
        setEventLocation(event.location);
        setEventSport(event.sport);
        setEventPrice(event.price);
        setEventImage(event.image);
        setEventThumbnail(event.thumbnail);
        setEventCapacity(event.capacity);
        setEventPaused(event.paused);
        setEventPaymentsActive(event.paymentsActive);
        setEventRegistrationDeadline(event.registrationDeadline);
        setEventEventLink(event.eventLink);
        setEventStripeFeeToCustomer(event.stripeFeeToCustomer);
        setEventPromotionalCodesEnabled(event.promotionalCodesEnabled);
        setEventIsActive(event.isActive);
        setEventIsPrivate(event.isPrivate);
        setEventFormId(event.formId);
        setEventHideVacancy(event.hideVacancy);
        setEventWaitlistEnabled(event.waitlistEnabled);
        setEventBookingApprovalEnabled(event.bookingApprovalEnabled);
        setEventShowAttendeesOnEventPage(event.showAttendeesOnEventPage);
        setEventMaxTicketsPerTransaction(
          clampMaxTicketsPerTransaction(
            event.maxTicketsPerTransaction ?? DEFAULT_MAX_TICKETS_PER_ORDER,
            event.capacity
          )
        );

        const nextEventMetadata = await getEventsMetadataByEventId(eventId);
        if (!isActive) return;
        setEventMetadata(nextEventMetadata);

        const allOrders = await getOrdersByIds(nextEventMetadata.orderIds);
        const allTickets = await getTicketsByIds(allOrders.flatMap((order) => order.tickets));
        const nextOrderTicketsMap = new Map<Order, Ticket[]>();
        allOrders.forEach((order) => {
          nextOrderTicketsMap.set(
            order,
            allTickets.filter((ticket) => ticket.orderId === order.orderId)
          );
        });
        if (!isActive) return;
        setOrderTicketsMap(nextOrderTicketsMap);

        try {
          await calculateNetSales(nextOrderTicketsMap);
        } catch (error) {
          eventServiceLogger.error(`Error calculating net sales: ${error}`);
        }
      } catch (error) {
        if (!isActive) return;
        eventServiceLogger.error(`Error fetching event for organiser v2 event hub: ${error}`);
        router.push("/error");
      } finally {
        await sleep(400);
        if (isActive) setLoading(false);
      }
    };

    void fetchEvent();
    return () => {
      isActive = false;
    };
  }, [eventId, router, user.userId]);

  const handleTogglePause = useCallback(async () => {
    const next = !eventPaused;
    setPauseUpdating(true);
    setEventPaused(next);
    try {
      await updateEventById(eventId, { paused: next });
      bustEventsLocalStorageCache();
    } catch (error) {
      setEventPaused(!next);
      eventServiceLogger.error(`Failed to toggle pause on event hub: ${error}`);
    } finally {
      setPauseUpdating(false);
    }
  }, [eventId, eventPaused]);

  const handleSectionChange = (next: EventHubSection) => {
    if (next === section) return;
    setSectionReady(false);
    window.setTimeout(() => {
      setSection(next);
      setSectionReady(true);
    }, 120);
  };

  const filled = Math.max(0, eventCapacity - eventVacancy);

  return (
    <div className="min-h-screen bg-surface text-foreground pb-8">
      <div className="bg-background border-b border-border">
        <EventHubChrome
          loading={loading}
          eventId={eventId}
          name={eventName}
          startDate={eventStartDate}
          location={eventLocation}
          image={eventImage || eventThumbnail}
          filled={filled}
          capacity={eventCapacity}
          paused={eventPaused}
          isActive={eventIsActive}
          isPrivate={eventIsPrivate}
          paymentsActive={eventPaymentsActive}
          onTogglePause={handleTogglePause}
          pauseUpdating={pauseUpdating}
        />

        <EventHubNav current={section} onChange={handleSectionChange} />
      </div>

      <div
        className={`px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pt-6 sm:pt-8 transition-opacity duration-200 ease-out ${
          sectionReady ? "opacity-100" : "opacity-0"
        }`}
      >
        {section === "Attendees" && (
          <EventHubAttendees
            eventData={eventData}
            eventMetadata={eventMetadata}
            setEventMetadata={setEventMetadata}
            eventId={eventId}
            orderTicketsMap={orderTicketsMap}
            setEventVacancy={setEventVacancy}
            setOrderTicketsMap={setOrderTicketsMap}
          />
        )}

        {section === "Details" && (
          <EventHubListing
            loading={loading}
            eventId={eventId}
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
            isActive={eventIsActive}
            eventFormId={eventFormId}
            updateData={async (id, data) => {
              await updateEventById(id, data);
              bustEventsLocalStorageCache();
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
              if (data.formId !== undefined) setEventFormId(data.formId);
              if (data.image !== undefined) setEventImage(data.image);
              if (data.thumbnail !== undefined) setEventThumbnail(data.thumbnail);
              if (data.isPrivate !== undefined) setEventIsPrivate(data.isPrivate);
            }}
          />
        )}

        {section === "Forms" && (
          <EventHubForms eventId={eventId} orderTicketsMap={orderTicketsMap} />
        )}

        {section === "Images" && (
          <EventHubImages
            user={user}
            eventId={eventId}
            eventImage={eventImage}
            eventThumbnail={eventThumbnail}
            updateData={async (id, data) => {
              await updateEventById(id, data);
              bustEventsLocalStorageCache();
              if (data.image !== undefined) setEventImage(data.image);
              if (data.thumbnail !== undefined) setEventThumbnail(data.thumbnail);
            }}
          />
        )}

        {section === "Settings" && (
          <EventHubSettings
            orderTicketsMap={orderTicketsMap}
            eventName={eventName}
            eventStartDate={eventStartDate}
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
    </div>
  );
}
