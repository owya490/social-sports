"use client";

import ShareModal from "@/components/events/ShareModal";
import EventDrilldownBanner from "@/components/organiser/EventDrilldownBanner";
import EventDrilldownCommunicationPage from "@/components/organiser/EventDrilldownCommunicationPage";
import EventDrilldownSharePage from "@/components/organiser/EventDrilldownSharePage";
import EventDrilldownSidePanel from "@/components/organiser/EventDrilldownSidePanel";
import EventDrilldownStatBanner from "@/components/organiser/EventDrilldownStatBanner";
import { EventDrilldownManageAttendeesPage } from "@/components/organiser/event/attendee/EventDrilldownManageAttendeesPage";
import EventDrilldownDetailsPage from "@/components/organiser/event/details/EventDrilldownDetailsPage";
import EventDrilldownFormsPage from "@/components/organiser/event/forms/EventDrilldownFormsPage";
import { EventDrilldownImagesPage } from "@/components/organiser/event/images/EventDrilldownImagesPage";
import EventDrilldownSettingsPage from "@/components/organiser/event/settings/EventDrilldownSettingsPage";
import { MobileEventDrilldownNavTabs } from "@/components/organiser/mobile/MobileEventDrilldownNavTabs";
import { useUser } from "@/components/utility/UserContext";
import { EmptyEventData, EmptyEventMetadata, EventData, EventId, EventMetadata } from "@/interfaces/EventTypes";
import { FormId } from "@/interfaces/FormTypes";
import { Order } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { EmptyPublicUserData, PublicUserData } from "@/interfaces/UserTypes";
import { getEventsMetadataByEventId } from "@/services/src/events/eventsMetadata/eventsMetadataService";
import { eventServiceLogger, getEventById, updateEventById } from "@/services/src/events/eventsService";
import { getOrdersByIds } from "@/services/src/tickets/orderService";
import { getTicketsByIds } from "@/services/src/tickets/ticketService";
import { calculateNetSales } from "@/services/src/tickets/ticketUtils/ticketUtils";
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
  const [eventData, setEventData] = useState<EventData>(EmptyEventData);
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
  const [eventWaitlistEnabled, setEventWaitlistEnabled] = useState<boolean>(true);
  const [eventBookingApprovalEnabled, setEventBookingApprovalEnabled] = useState<boolean>(false);
  const [eventIsActive, setEventIsActive] = useState<boolean>(false);
  const [eventFormId, setEventFormId] = useState<FormId | null>(null);
  const [totalNetSales, setTotalNetSales] = useState<number>(0);
  const [orderTicketsMap, setOrderTicketsMap] = useState<Map<Order, Ticket[]>>(new Map());
  const router = useRouter();

  const { user } = useUser();

  const eventId: EventId = params.id;
  useEffect(() => {
    if (user.userId) {
      getEventById(eventId)
      .then((event) => {
        if (event.organiserId !== user.userId) {
          router.push("/organiser/dashboard");
          return EmptyEventData;
        }
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
        setEventWaitlistEnabled(event.waitlistEnabled);
        setEventBookingApprovalEnabled(event.bookingApprovalEnabled);
        return event;
      })
      .then((event) => {
        getEventsMetadataByEventId(eventId).then(async (eventMetadata) => {
          setEventMetadata(eventMetadata);
          const allOrders = await getOrdersByIds(eventMetadata.orderIds);
          const allTickets = await getTicketsByIds(allOrders.flatMap((order) => order.tickets));
          const orderTicketsMap = new Map<Order, Ticket[]>();
          allOrders.forEach((order) => {
            orderTicketsMap.set(
              order,
              allTickets.filter((ticket) => ticket.orderId === order.orderId)
            );
          });
          setOrderTicketsMap(orderTicketsMap);
          calculateNetSales(orderTicketsMap)
            .then((totalNetSales) => {
              setTotalNetSales(totalNetSales);
            })
            .catch((error) => {
              eventServiceLogger.error(`Error calculating net sales: ${error}`);
              setTotalNetSales(eventMetadata.completeTicketCount * event.price);
            });
        });
      })
      .finally(async () => {
        await sleep(500);
        setLoading(false);
      })
      .catch((error) => {
        eventServiceLogger.error(`Error fetching event by eventId for organiser event drilldown: ${error}`);
        router.push("/error");
      });
    }
  }, [user.userId]);

  return (
    <>
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
          completeTicketCount={eventMetadata.completeTicketCount}
          eventCapacity={eventCapacity}
          eventPrice={eventPrice}
          totalNetSales={totalNetSales}
        />
        <MobileEventDrilldownNavTabs
          navigationTabs={["Details", "Attendees", "Forms", "Images", "Settings"]}
          currSidebarPage={currSidebarPage}
          setCurrSidebarPage={setCurrSidebarPage}
        />
        <div className="flex flex-row md:mt-10 max-w-6xl xl:mx-auto">
          <div className="hidden sm:block sticky top-[110px] self-start z-20">
            <EventDrilldownSidePanel
              loading={loading}
              currSidebarPage={currSidebarPage}
              setCurrSidebarPage={setCurrSidebarPage}
              eventName={eventName}
              eventStartDate={eventStartDate}
              user={user}
            />
          </div>
          <div className="flex-1 w-full mb-20 sm:mb-0">
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
                eventData={eventData}
                setEventVacancy={setEventVacancy}
                setEventMetadata={setEventMetadata}
                orderTicketsMap={orderTicketsMap}
                setOrderTicketsMap={setOrderTicketsMap}
              />
            )}
            {currSidebarPage === "Forms" && <EventDrilldownFormsPage eventId={eventId} eventMetadata={eventMetadata} />}
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
                waitlistEnabled={eventWaitlistEnabled}
                setWaitlistEnabled={setEventWaitlistEnabled}
                bookingApprovalEnabled={eventBookingApprovalEnabled}
                setBookingApprovalEnabled={setEventBookingApprovalEnabled}
              />
            )}
            {currSidebarPage === "Communication" && <EventDrilldownCommunicationPage />}
            {currSidebarPage === "Share" && <EventDrilldownSharePage />}
          </div>
        </div>
      </div>
    </>
  );
}
