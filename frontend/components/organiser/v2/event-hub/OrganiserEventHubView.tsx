"use client";

/**
 * THESIS: Tabs guide the session; Details owns the event overview; deep work opens a right drawer / bottom sheet — refuses expand-in-place and cover-in-header.
 * OWN-WORLD: Honest Clubhouse — surface canvas, Satoshi, 12px radius, yellow only on primary panel CTAs.
 * STORY: Organiser lands on Details (preview, hosts, read-only visibility), edits via panels; Registrations and Forms use the same panel grammar.
 * FIRST VIEWPORT: Quiet header (title + Event page) + peer tabs; Details two-column overview with Edit details / Change photo.
 * FORM: Luma overview-led canon; seed luma-overview-led; Comp A approved; drawers from steer.
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
 */

import { EventHubAttendees } from "@/components/organiser/v2/event-hub/EventHubAttendees";
import { EventHubHeader } from "@/components/organiser/v2/event-hub/EventHubHeader";
import { EventHubRegistration } from "@/components/organiser/v2/event-hub/EventHubRegistration";
import { EventHubListing } from "@/components/organiser/v2/event-hub/EventHubListing";
import { EventHubNav } from "@/components/organiser/v2/event-hub/EventHubNav";
import { EventHubSettings } from "@/components/organiser/v2/event-hub/EventHubSettings";
import { EventHubSection } from "@/components/organiser/v2/event-hub/eventHubTypes";
import { DASHBOARD_PATH } from "@/components/organiser/v2/welcome/welcomeOnboarding";
import { useUser } from "@/components/utility/UserContext";
import {
  EmptyEventData,
  EmptyEventMetadata,
  EventData,
  EventId,
  EventMetadata,
  DEFAULT_MAX_TICKETS_PER_ORDER,
} from "@/interfaces/EventTypes";
import { EventTicketTypesMap } from "@/interfaces/EventTicketTypeTypes";
import { Order, OrderAndTicketStatus } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { getEventsMetadataByEventId } from "@/services/src/events/eventsMetadata/eventsMetadataService";
import { eventServiceLogger, getEventById, updateEventById } from "@/services/src/events/eventsService";
import { bustEventsLocalStorageCache } from "@/services/src/events/eventsUtils/getEventsUtils";
import { bustOrganiserEventsCache } from "@/services/src/organiser/organiserEventsService";
import { resolveEventInventory } from "@/services/src/events/eventsUtils/eventTicketTypesUtils";
import { clampMaxTicketsPerTransaction } from "@/services/src/events/eventsUtils/ticketLimits";
import { getOrdersByIds } from "@/services/src/tickets/orderService";
import { getTicketsByIds } from "@/services/src/tickets/ticketService";
import { calculateNetSales } from "@/services/src/tickets/ticketUtils/ticketUtils";
import { Timestamp } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Shared event hub body — production route + welcome twin.
 */
export function OrganiserEventHubView() {
  const params = useParams<{ id: string }>();
  const eventId = params.id as EventId;
  const router = useRouter();
  const { user } = useUser();

  const [section, setSection] = useState<EventHubSection>("Details");
  const [sectionReady, setSectionReady] = useState(true);
  const hasAppliedPendingLandingRef = useRef(false);
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
  const [eventTicketTypes, setEventTicketTypes] = useState<EventTicketTypesMap | undefined>(undefined);
  const [orderTicketsMap, setOrderTicketsMap] = useState<Map<Order, Ticket[]>>(new Map());

  useEffect(() => {
    if (!user.userId) return;

    let isActive = true;
    hasAppliedPendingLandingRef.current = false;
    setSection("Details");

    const fetchEvent = async () => {
      try {
        const [event, nextEventMetadata] = await Promise.all([
          getEventById(eventId),
          getEventsMetadataByEventId(eventId),
        ]);
        if (!isActive) return;

        if (event.organiserId !== user.userId) {
          router.push(DASHBOARD_PATH);
          return;
        }

        setEventData(event);
        setEventName(event.name);
        setEventStartDate(event.startDate);
        setEventEndDate(event.endDate);
        const inventory = resolveEventInventory(event);
        setEventVacancy(inventory.vacancy);
        setEventDescription(event.description);
        setEventLocation(event.location);
        setEventSport(event.sport);
        setEventPrice(inventory.price);
        setEventImage(event.image);
        setEventThumbnail(event.thumbnail);
        setEventCapacity(inventory.capacity);
        setEventPaused(event.paused);
        setEventPaymentsActive(event.paymentsActive);
        setEventRegistrationDeadline(event.registrationDeadline);
        setEventEventLink(event.eventLink ?? "");
        setEventStripeFeeToCustomer(event.stripeFeeToCustomer);
        setEventPromotionalCodesEnabled(event.promotionalCodesEnabled);
        setEventIsActive(event.isActive);
        setEventIsPrivate(event.isPrivate);
        setEventTicketTypes(event.eventTicketTypes);
        setEventHideVacancy(event.hideVacancy);
        setEventWaitlistEnabled(event.waitlistEnabled);
        setEventBookingApprovalEnabled(event.bookingApprovalEnabled);
        setEventShowAttendeesOnEventPage(event.showAttendeesOnEventPage);
        setEventMaxTicketsPerTransaction(
          clampMaxTicketsPerTransaction(
            event.maxTicketsPerTransaction ?? DEFAULT_MAX_TICKETS_PER_ORDER,
            inventory.capacity
          )
        );

        setEventMetadata(nextEventMetadata);
        if (isActive) setLoading(false);

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

        if (!hasAppliedPendingLandingRef.current) {
          hasAppliedPendingLandingRef.current = true;
          const hasPendingBooking = allOrders.some(
            (order) => order.status === OrderAndTicketStatus.PENDING
          );
          if (hasPendingBooking) {
            setSection("Registrations");
          }
        }

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
      bustOrganiserEventsCache();
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
        <EventHubHeader
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
        data-tour="event-hub-overview"
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
            eventTicketTypes={eventTicketTypes}
            orderTicketsMap={orderTicketsMap}
            setEventTicketTypes={(types) => {
              setEventTicketTypes(types);
              setEventData((prev) => ({ ...prev, eventTicketTypes: types }));
              const inventory = resolveEventInventory({ eventTicketTypes: types });
              setEventCapacity(inventory.capacity);
              setEventVacancy(inventory.vacancy);
              setEventPrice(inventory.price);
            }}
            updateData={async (id, data) => {
              await updateEventById(id, data);
              bustEventsLocalStorageCache();
              bustOrganiserEventsCache();
              if (data.name !== undefined) setEventName(data.name);
              if (data.description !== undefined) setEventDescription(data.description);
              if (data.location !== undefined) setEventLocation(data.location);
              if (data.sport !== undefined) setEventSport(data.sport);
              if (data.startDate !== undefined) setEventStartDate(data.startDate);
              if (data.endDate !== undefined) setEventEndDate(data.endDate);
              if (data.registrationDeadline !== undefined) {
                setEventRegistrationDeadline(data.registrationDeadline);
              }
              if (data.eventLink !== undefined) setEventEventLink(data.eventLink ?? "");
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
            onEventRefresh={(event) => {
              setEventData(event);
              setEventTicketTypes(event.eventTicketTypes);
              const inventory = resolveEventInventory(event);
              setEventCapacity(inventory.capacity);
              setEventVacancy(inventory.vacancy);
              setEventPrice(inventory.price);
            }}
            setOrderTicketsMap={setOrderTicketsMap}
          />
        )}

        {section === "Forms" && (
          <EventHubRegistration
            eventId={eventId}
            orderTicketsMap={orderTicketsMap}
            eventTicketTypes={eventTicketTypes}
            setEventTicketTypes={(types) => {
              setEventTicketTypes(types);
              setEventData((prev) => ({ ...prev, eventTicketTypes: types }));
              const inventory = resolveEventInventory({ eventTicketTypes: types });
              setEventCapacity(inventory.capacity);
              setEventVacancy(inventory.vacancy);
              setEventPrice(inventory.price);
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
