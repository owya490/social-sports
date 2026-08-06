"use client";

/**
 * THESIS: Tabs guide the session; Details owns the event overview; deep work opens a right drawer / bottom sheet — refuses expand-in-place and cover-in-chrome.
 * OWN-WORLD: Honest Clubhouse — surface canvas, Satoshi, 12px radius, yellow only on primary panel CTAs.
 * STORY: Organiser lands on Details (preview, hosts, read-only visibility), edits via panels; Registrations and Forms use the same panel grammar.
 * FIRST VIEWPORT: Quiet chrome (title + Event page) + peer tabs; Details two-column overview with Edit details / Change photo.
 * FORM: Luma overview-led canon; seed luma-overview-led; Comp A approved; drawers from steer.
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
 */

import { EventHubAttendees } from "@/components/organiser/v2/event-hub/EventHubAttendees";
import { EventHubChrome } from "@/components/organiser/v2/event-hub/EventHubChrome";
import { EventHubForms } from "@/components/organiser/v2/event-hub/EventHubForms";
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

  const [section, setSection] = useState<EventHubSection>("Details");
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

  return (
    <div className="min-h-screen bg-surface text-foreground pb-8">
      <div className="bg-background border-b border-border">
        <EventHubChrome
          loading={loading}
          eventId={eventId}
          name={eventName}
          startDate={eventStartDate}
          location={eventLocation}
          paused={eventPaused}
          isActive={eventIsActive}
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
            eventImage={eventImage}
            eventThumbnail={eventThumbnail}
            isActive={eventIsActive}
            isPrivate={eventIsPrivate}
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

        {section === "Registrations" && (
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

        {section === "Forms" && (
          <EventHubForms eventId={eventId} orderTicketsMap={orderTicketsMap} />
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
