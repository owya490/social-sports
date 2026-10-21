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
import { EventBooleanSettingKey, EventSettingsIntent, eventSettingRequiresStripe, getEventSettingsIntentBlockReason } from "@/components/organiser/v2/shared/eventSettingsIntent";
import { SettingsSaveFeedback } from "@/components/organiser/v2/shared/SettingsSaveFeedback";
import { useSettingsAutosave } from "@/components/organiser/v2/shared/useSettingsAutosave";
import { useEventFormAttachment } from "@/components/organiser/v2/event-hub/useEventFormAttachment";
import { ConnectStripeCta } from "@/components/organiser/v2/settings/ConnectStripeCta";
import {
  loadRegistrationData,
  mergeOrderTicketsByOrderId,
  type RegistrationUpdateIssue,
} from "@/components/organiser/v2/event-hub/registrationLiveUpdates";
import { DASHBOARD_PATH } from "@/components/organiser/v2/welcome/welcomeOnboarding";
import { useUser } from "@/components/utility/UserContext";
import {
  EmptyEventData,
  EmptyEventMetadata,
  EventData,
  EventFormAttachmentResult,
  EventId,
  EventMetadata,
  OrderId,
  DEFAULT_MAX_TICKETS_PER_ORDER,
} from "@/interfaces/EventTypes";
import { EventTicketTypeId, EventTicketTypesMap } from "@/interfaces/EventTicketTypeTypes";
import { Order, OrderAndTicketStatus } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import {
  getEventsMetadataByEventId,
  subscribeToEventMetadata,
} from "@/services/src/events/eventsMetadata/eventsMetadataService";
import {
  eventServiceLogger,
  getEventById,
  updateEventById,
} from "@/services/src/events/eventsService";
import { bustEventsLocalStorageCache } from "@/services/src/events/eventsUtils/getEventsUtils";
import { bustOrganiserEventsCache } from "@/services/src/organiser/organiserEventsService";
import { applyEventFormAttachmentToTicketTypes, resolveEventInventory } from "@/services/src/events/eventsUtils/eventTicketTypesUtils";
import { clampMaxTicketsPerTransaction } from "@/services/src/events/eventsUtils/ticketLimits";
import { calculateNetSales } from "@/services/src/tickets/ticketUtils/ticketUtils";
import { isStripeAccountActive } from "@/services/src/stripe/stripeUtils";
import { Timestamp } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type EventSettingsPatch = Partial<Pick<EventData, EventBooleanSettingKey | "maxTicketsPerTransaction">>;

type EventReadReconciliation = {
  ticketTypes: Map<EventTicketTypeId, { result: EventFormAttachmentResult; previousName: string | undefined }>;
  eventForm: EventFormAttachmentResult | null;
  settings: EventSettingsPatch;
};

/**
 * Shared event hub body — production route + welcome twin.
 */
export function OrganiserEventHubView() {
  const params = useParams<{ id: string }>();
  const eventId = params.id as EventId;
  const { auth, user } = useUser();
  return <EventHubOwner key={`${eventId}:${auth.currentUser?.uid ?? ""}:${user.userId}`} eventId={eventId} />;
}

function EventHubOwner({ eventId }: { eventId: EventId }) {
  const router = useRouter();
  const { auth, user, userLoading } = useUser();
  const authRef = useRef(auth);
  authRef.current = auth;

  const [section, setSection] = useState<EventHubSection>("Details");
  const [sectionReady, setSectionReady] = useState(true);
  const hasAppliedPendingLandingRef = useRef(false);
  const [eventData, setEventData] = useState<EventData>(EmptyEventData);
  const [loading, setLoading] = useState(true);
  const settingsMutationLockRef = useRef(false);
  const ownerActiveRef = useRef(true);
  const ownerUserIdRef = useRef(user.userId);
  const accountRef = useRef({ userId: user.userId, userLoading });
  accountRef.current = { userId: user.userId, userLoading };
  const isCurrentAccount = useCallback(() => ownerActiveRef.current && Boolean(ownerUserIdRef.current) &&
    accountRef.current.userId === ownerUserIdRef.current &&
    authRef.current.currentUser?.uid === ownerUserIdRef.current, []);
  const accountReady = !userLoading && isCurrentAccount();

  useEffect(() => {
    ownerActiveRef.current = true;
    return () => { ownerActiveRef.current = false; };
  }, []);

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
  const eventIsActive = eventData.isActive;
  const [eventIsPrivate, setEventIsPrivate] = useState(false);
  const [eventTicketTypes, setEventTicketTypes] = useState<EventTicketTypesMap | undefined>(undefined);
  const [orderTicketsMap, setOrderTicketsMap] = useState<Map<Order, Ticket[]>>(new Map());
  const [registrationUpdateIssue, setRegistrationUpdateIssue] =
    useState<RegistrationUpdateIssue>(null);
  const loadedOrderIdsRef = useRef<Set<OrderId>>(new Set());
  // Late snapshots must preserve overlapping local edits without masking later server edits.
  const eventReadsRef = useRef(new Set<EventReadReconciliation>());
  const pendingSettingsPatchRef = useRef<EventSettingsPatch | null>(null);
  const readEvent = useCallback(async (onRead: (event: EventData) => void) => {
    const reconciliation: EventReadReconciliation = {
      ticketTypes: new Map(), eventForm: null, settings: { ...pendingSettingsPatchRef.current },
    };
    eventReadsRef.current.add(reconciliation);
    try {
      const loadedEvent = await getEventById(eventId);
      let types = loadedEvent.eventTicketTypes;
      for (const { result, previousName } of reconciliation.ticketTypes.values()) {
        types = applyEventFormAttachmentToTicketTypes(types, result, previousName);
      }
      const event = {
        ...loadedEvent,
        ...reconciliation.settings,
        eventTicketTypes: types,
        ...(reconciliation.eventForm ? { formId: reconciliation.eventForm.formId } : {}),
      };
      onRead(event);
      return event;
    } finally {
      eventReadsRef.current.delete(reconciliation);
    }
  }, [eventId]);

  const refreshEvent = useCallback(async () => {
    if (!ownerActiveRef.current) return;
    if (!isCurrentAccount()) {
      throw new Error("The event could not be refreshed for this account.");
    }
    await readEvent((event) => {
      if (!ownerActiveRef.current) return;
      if (event.eventId !== eventId || event.organiserId !== ownerUserIdRef.current || !isCurrentAccount()) {
        throw new Error("The event could not be refreshed for this account.");
      }
      setEventData(event);
      setEventTicketTypes(event.eventTicketTypes);
      const inventory = resolveEventInventory(event);
      setEventCapacity(inventory.capacity);
      setEventVacancy(inventory.vacancy);
      setEventPrice(inventory.price);
    });
  }, [readEvent, eventId, isCurrentAccount]);

  const attachment = useEventFormAttachment({
    eventId,
    canSave: !loading && accountReady && eventData.organiserId === ownerUserIdRef.current,
    isCurrentAccount,
    onSaved: (result) => {
      if (result.eventId !== eventId || !isCurrentAccount()) return;
      const previousName = result.target.kind === "ticketType"
        ? eventTicketTypes?.[result.target.eventTicketTypeId]?.name
        : undefined;
      for (const attachments of eventReadsRef.current) {
        if (result.target.kind === "ticketType") {
          const typeId = result.target.eventTicketTypeId;
          const earlier = attachments.ticketTypes.get(typeId);
          attachments.ticketTypes.set(typeId, { result, previousName: earlier ? earlier.previousName : previousName });
        }
        if (result.eventFormIdUpdated) attachments.eventForm = result;
      }
      setEventTicketTypes((current) => applyEventFormAttachmentToTicketTypes(current, result, previousName));
      setEventData((current) => ({
        ...current,
        eventTicketTypes: applyEventFormAttachmentToTicketTypes(current.eventTicketTypes, result, previousName),
        ...(result.eventFormIdUpdated ? { formId: result.formId } : {}),
      }));
    },
    onReloadTargets: refreshEvent,
  });

  useEffect(() => {
    if (!accountReady || !isCurrentAccount()) return;

    let isActive = true;
    let unsubscribeMetadata: (() => void) | null = null;
    loadedOrderIdsRef.current = new Set();
    hasAppliedPendingLandingRef.current = false;
    setLoading(true);
    setSection("Details");
    setRegistrationUpdateIssue(null);

    const fetchEvent = async () => {
      try {
        const event = await readEvent((event) => {
          if (!isActive || !isCurrentAccount()) return;

          if (event.organiserId !== ownerUserIdRef.current) {
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
        });
        if (!isActive || !isCurrentAccount() || event.organiserId !== ownerUserIdRef.current) return;
        const nextEventMetadata = await getEventsMetadataByEventId(eventId);
        const { allOrders, orderTicketsMap: nextOrderTicketsMap } =
          await loadRegistrationData(nextEventMetadata.orderIds);
        if (!isActive || !isCurrentAccount()) return;

        setEventMetadata(nextEventMetadata);
        loadedOrderIdsRef.current = new Set(nextEventMetadata.orderIds);
        setOrderTicketsMap(nextOrderTicketsMap);

        unsubscribeMetadata = subscribeToEventMetadata(
          eventId,
          (metadata) => {
            if (!isActive || !isCurrentAccount()) return;
            setEventMetadata(metadata);
            setRegistrationUpdateIssue((current) =>
              current === "listener" ? null : current
            );
            const newOrderIds = metadata.orderIds.filter(
              (orderId) => !loadedOrderIdsRef.current.has(orderId)
            );
            if (newOrderIds.length === 0) return;

            newOrderIds.forEach((orderId) => loadedOrderIdsRef.current.add(orderId));
            void loadRegistrationData(newOrderIds)
              .then(({ orderTicketsMap: additions }) => {
                if (!isActive || !isCurrentAccount()) return;
                setOrderTicketsMap((current) => {
                  const currentOrderIds = new Set(
                    Array.from(current.keys(), (order) => order.orderId)
                  );
                  const unseenAdditions = new Map(
                    Array.from(additions).filter(([order]) => !currentOrderIds.has(order.orderId))
                  );
                  return mergeOrderTicketsByOrderId(current, unseenAdditions);
                });
              })
              .catch((error) => {
                if (!isActive || !isCurrentAccount()) return;
                eventServiceLogger.error(`Error loading new event registrations: ${error}`);
                setRegistrationUpdateIssue((current) =>
                  current === "listener" ? current : "sync"
                );
              });
          },
          () => {
            if (isActive && isCurrentAccount()) setRegistrationUpdateIssue("listener");
          }
        );

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
        if (!isActive || !isCurrentAccount()) return;
        eventServiceLogger.error(`Error fetching event for organiser v2 event hub: ${error}`);
        router.push("/error");
      } finally {
        if (isActive && isCurrentAccount()) setLoading(false);
      }
    };

    void fetchEvent();
    return () => {
      isActive = false;
      unsubscribeMetadata?.();
    };
  }, [
    accountReady,
    eventId,
    router,
    isCurrentAccount,
    readEvent,
  ]);

  const settings = useSettingsAutosave<EventSettingsIntent>({
    mutationLockRef: settingsMutationLockRef,
    failureMessage: "Couldn’t save this setting. The previous value was restored. Try again.",
    prepare: (intent) => {
      if (accountRef.current.userLoading || !isCurrentAccount()) {
        return { kind: "blocked", message: "Wait for your account to finish loading, then try again." };
      }
      if (loading) {
        return { kind: "blocked", message: "Wait for your event to finish loading, then try again." };
      }
      if (intent.kind === "headerPause" && !eventIsActive) {
        return { kind: "blocked", message: "This event is inactive. Registration can still be managed in Settings." };
      }
      const blocked = getEventSettingsIntentBlockReason(intent, {
        stripeAccountActive: user.stripeAccountActive,
        eventPrice,
        eventCapacity,
      });
      if (blocked) return { kind: "blocked", message: blocked };
      const reconcileSetting = (data: EventSettingsPatch) => {
        if (!isCurrentAccount()) return;
        for (const read of eventReadsRef.current) Object.assign(read.settings, data);
        setEventData((current) => ({ ...current, ...data }));
      };
      const persist = async (data: Partial<EventData>) => {
        if (!isCurrentAccount() || accountRef.current.userLoading) throw new Error("The account is not ready to save this setting.");
        await updateEventById(eventId, data);
        if (!isCurrentAccount()) throw new Error("This event is no longer open.");
        pendingSettingsPatchRef.current = null;
        for (const invalidate of [bustEventsLocalStorageCache, bustOrganiserEventsCache]) {
          try {
            invalidate();
          } catch (error) {
            eventServiceLogger.error(`Error invalidating event caches after saving settings: ${error}`);
          }
        }
        if (!isCurrentAccount()) throw new Error("This event is no longer open.");
      };
      if (intent.kind === "maxTickets") {
        const previous = eventMaxTicketsPerTransaction;
        return { kind: "ready", operation: {
          apply: () => {
            if (!isCurrentAccount()) return;
            pendingSettingsPatchRef.current = { maxTicketsPerTransaction: intent.value };
            reconcileSetting(pendingSettingsPatchRef.current);
            setEventMaxTicketsPerTransaction(intent.value);
          },
          rollback: () => {
            if (!isCurrentAccount()) return;
            pendingSettingsPatchRef.current = null;
            reconcileSetting({ maxTicketsPerTransaction: previous });
            setEventMaxTicketsPerTransaction(previous);
          },
          persist: () => persist({ maxTicketsPerTransaction: intent.value }),
        } };
      }
      const controls: Record<EventBooleanSettingKey, { value: boolean; set: (value: boolean) => void }> = {
        paused: { value: eventPaused, set: setEventPaused },
        paymentsActive: { value: eventPaymentsActive, set: setEventPaymentsActive },
        stripeFeeToCustomer: { value: eventStripeFeeToCustomer, set: setEventStripeFeeToCustomer },
        promotionalCodesEnabled: { value: eventPromotionalCodesEnabled, set: setEventPromotionalCodesEnabled },
        hideVacancy: { value: eventHideVacancy, set: setEventHideVacancy },
        waitlistEnabled: { value: eventWaitlistEnabled, set: setEventWaitlistEnabled },
        bookingApprovalEnabled: { value: eventBookingApprovalEnabled, set: setEventBookingApprovalEnabled },
        showAttendeesOnEventPage: { value: eventShowAttendeesOnEventPage, set: setEventShowAttendeesOnEventPage },
      };
      const key = intent.kind === "headerPause" ? "paused" : intent.key;
      const control = controls[key];
      return { kind: "ready", operation: {
        apply: () => {
          if (!isCurrentAccount()) return;
          pendingSettingsPatchRef.current = { [key]: intent.value };
          reconcileSetting(pendingSettingsPatchRef.current);
          control.set(intent.value);
        },
        rollback: () => {
          if (!isCurrentAccount()) return;
          pendingSettingsPatchRef.current = null;
          reconcileSetting({ [key]: control.value });
          control.set(control.value);
        },
        persist: () => persist({ [key]: intent.value }),
      } };
    },
  });
  const settingsBlocked = settings.isSaving || !accountReady || loading;
  const failedSettingsIntent = isCurrentAccount() ? settings.failedIntent : null;
  const needsStripeRecovery = failedSettingsIntent?.kind === "boolean" &&
    eventSettingRequiresStripe(failedSettingsIntent.key) &&
    !isStripeAccountActive(user.stripeAccountActive);

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
          event={eventData}
          eventId={eventId}
          name={eventName}
          startDate={eventStartDate}
          location={eventLocation}
          paused={eventPaused}
          isActive={eventIsActive}
          onTogglePause={() => void settings.run({ kind: "headerPause", value: !eventPaused })}
          pauseUpdating={settingsBlocked}
        />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <SettingsSaveFeedback status={isCurrentAccount() ? settings.status : "idle"} errorMessage={settings.errorMessage} onRetry={() => void settings.retry()} retryDisabled={settingsBlocked} className={settings.status === "idle" ? "" : "pb-3"} />
          {needsStripeRecovery ? <ConnectStripeCta className="mb-3" /> : null}
          {failedSettingsIntent?.kind === "headerPause" && !eventIsActive ? (
            <button type="button" onClick={() => handleSectionChange("Settings")} className="mb-3 min-h-11 text-xs font-medium underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">Open Settings</button>
          ) : null}
        </div>

        <EventHubNav current={section} onChange={handleSectionChange} disabled={loading} />
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
            eventId={eventId}
            orderTicketsMap={orderTicketsMap}
            setEventVacancy={setEventVacancy}
            onEventRefresh={refreshEvent}
            onRegistrationAppended={(orderId) => loadedOrderIdsRef.current.add(orderId)}
            setOrderTicketsMap={setOrderTicketsMap}
            registrationUpdateIssue={registrationUpdateIssue}
          />
        )}

        {section === "Forms" && (
          <EventHubRegistration
            eventId={eventId}
            eventData={eventData}
            loading={loading}
            orderTicketsMap={orderTicketsMap}
            attachment={attachment}
          />
        )}

        {section === "Settings" && (
          <EventHubSettings
            orderTicketsMap={orderTicketsMap}
            eventName={eventName}
            eventStartDate={eventStartDate}
            eventId={eventId}
            paused={eventPaused}
            saveSettings={settings.run}
            isSaving={settingsBlocked}
            paymentsActive={eventPaymentsActive}
            stripeFeeToCustomer={eventStripeFeeToCustomer}
            promotionalCodesEnabled={eventPromotionalCodesEnabled}
            hideVacancy={eventHideVacancy}
            waitlistEnabled={eventWaitlistEnabled}
            bookingApprovalEnabled={eventBookingApprovalEnabled}
            showAttendeesOnEventPage={eventShowAttendeesOnEventPage}
            maxTicketsPerTransaction={eventMaxTicketsPerTransaction}
            eventCapacity={eventCapacity}
            eventPrice={eventPrice}
          />
        )}
      </div>
    </div>
  );
}
