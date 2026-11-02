"use client";

/**
 * THESIS: Tabs guide the series; Details twins the event hub overview; Past events / Recurrence / Settings are peer work — refuses legacy sidebar drilldown.
 * OWN-WORLD: Honest Clubhouse — surface canvas, Satoshi, 12px radius, yellow only on Save / Update.
 * STORY: Organiser lands on Details (preview, hosts, visibility), edits via panels; schedule and prefs stay peer-findable.
 * FIRST VIEWPORT: Quiet header (← Recurring, title, Template chip) + peer tabs; Details two-column overview.
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
import { EventBooleanSettingKey, RecurringSettingsIntent, eventSettingRequiresStripe, getEventSettingsIntentBlockReason } from "@/components/organiser/v2/shared/eventSettingsIntent";
import { SettingsSaveFeedback } from "@/components/organiser/v2/shared/SettingsSaveFeedback";
import { useSettingsAutosave } from "@/components/organiser/v2/shared/useSettingsAutosave";
import { ConnectStripeCta } from "@/components/organiser/v2/settings/ConnectStripeCta";
import { useUser } from "@/components/utility/UserContext";
import { EventTicketTypesMap } from "@/interfaces/EventTicketTypeTypes";
import {
  DEFAULT_MAX_TICKETS_PER_ORDER,
  EventData,
  EventId,
} from "@/interfaces/EventTypes";
import { Order } from "@/interfaces/OrderTypes";
import {
  DEFAULT_RECURRENCE_FORM_DATA,
  Frequency,
  NewRecurrenceFormData,
  RecurrenceTemplateId,
} from "@/interfaces/RecurringEventTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { Logger } from "@/observability/logger";
import { clampMaxTicketsPerTransaction } from "@/services/src/events/eventsUtils/ticketLimits";
import {
  findGeneralAdmissionTicketType,
  GENERAL_TICKET_TYPE_NAME,
  resolveEventInventory,
} from "@/services/src/events/eventsUtils/eventTicketTypesUtils";
import {
  calculateRecurrenceEnded,
  getRecurrenceTemplate,
  updateRecurrenceTemplateEventData,
  updateRecurrenceTemplateRecurrenceData,
} from "@/services/src/recurringEvents/recurringEventsService";
import { extractNewRecurrenceFormDataFromRecurrenceData } from "@/services/src/recurringEvents/recurringEventsUtils";
import { isStripeAccountActive } from "@/services/src/stripe/stripeUtils";
import { Timestamp } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const logger = new Logger("RecurringHubV2Page");
const EMPTY_ORDER_TICKETS_MAP = new Map<Order, Ticket[]>();
const ACCOUNT_NOT_READY_MESSAGE = "Wait for your account to finish loading, then try again.";

export default function OrganiserRecurringHubV2Page() {
  const params = useParams<{ id: string }>();
  const recurrenceTemplateId = params.id as RecurrenceTemplateId;
  const { auth, user } = useUser();
  return <RecurringHubOwner key={`${recurrenceTemplateId}:${auth.currentUser?.uid ?? ""}:${user.userId}`} recurrenceTemplateId={recurrenceTemplateId} />;
}

function RecurringHubOwner({ recurrenceTemplateId }: { recurrenceTemplateId: RecurrenceTemplateId }) {
  const router = useRouter();
  const { auth, user, userLoading } = useUser();

  const [section, setSection] = useState<RecurringHubSection>("Details");
  const [sectionReady, setSectionReady] = useState(true);
  const [loading, setLoading] = useState(true);
  const [updatingRecurrenceData, setUpdatingRecurrenceData] = useState(false);
  const [explicitMutationPending, setExplicitMutationPending] = useState(false);
  const [completedMutationCount, setCompletedMutationCount] = useState(0);
  const mutationLockRef = useRef(false);
  const lifetimeRef = useRef({ active: true, generation: 0 });
  const ownerUserIdRef = useRef(user.userId);
  const accountRef = useRef({ auth, userId: user.userId, userLoading, loading });
  accountRef.current = { auth, userId: user.userId, userLoading, loading };
  const initialLoadStartedRef = useRef(false);
  const isCurrentAccount = useCallback(() => Boolean(ownerUserIdRef.current) &&
    accountRef.current.userId === ownerUserIdRef.current &&
    accountRef.current.auth.currentUser?.uid === ownerUserIdRef.current, []);
  const accountReady = !userLoading && isCurrentAccount();

  useEffect(() => {
    const lifetime = lifetimeRef.current;
    lifetime.active = true;
    lifetime.generation += 1;
    return () => {
      lifetime.active = false;
      lifetime.generation += 1;
    };
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
  const [seriesState, setSeriesState] = useState({ isActive: false, statusAvailable: false });
  const [eventIsPrivate, setEventIsPrivate] = useState(false);
  const [eventTicketTypes, setEventTicketTypes] = useState<EventTicketTypesMap | undefined>(undefined);
  const [frequency, setFrequency] = useState<Frequency>(Frequency.WEEKLY);
  const [pastEvents, setPastEvents] = useState<Record<string, EventId>>({});
  const [recurrenceEnded, setRecurrenceEnded] = useState(false);
  const [newRecurrenceData, setNewRecurrenceData] =
    useState<NewRecurrenceFormData>(DEFAULT_RECURRENCE_FORM_DATA);
  const [originalRecurrenceData, setOriginalRecurrenceData] = useState<NewRecurrenceFormData | null>(
    null
  );
  const [saveNotice, setSaveNotice] = useState<"success" | "error" | "busy" | "account" | null>(null);
  const recurrenceSaveNoticeRequestRef = useRef(0);

  const settings = useSettingsAutosave<RecurringSettingsIntent>({
    mutationLockRef,
    failureMessage: "Couldn’t save this setting. The previous value was restored. Try again.",
    prepare: (intent) => {
      if (accountRef.current.userLoading || !isCurrentAccount()) {
        return { kind: "blocked", message: ACCOUNT_NOT_READY_MESSAGE };
      }
      if (loading) {
        return { kind: "blocked", message: "Wait for your series to finish loading, then try again." };
      }
      if (intent.kind === "boolean" && intent.key === "paused" && (!seriesState.statusAvailable || !seriesState.isActive)) {
        return { kind: "blocked", message: seriesState.statusAvailable
          ? "This series is inactive. Extend the schedule before changing bookings."
          : "Series status is unavailable. Reload the page before changing bookings." };
      }
      const blocked = getEventSettingsIntentBlockReason(intent, {
        stripeAccountActive: user.stripeAccountActive,
        eventPrice,
        eventCapacity,
      });
      if (blocked) return { kind: "blocked", message: blocked };
      const generation = lifetimeRef.current.generation;
      const isCurrent = () => lifetimeRef.current.active && lifetimeRef.current.generation === generation && isCurrentAccount();
      const persist = async (data: Partial<EventData>) => {
        if (!isCurrent() || accountRef.current.userLoading) throw new Error(ACCOUNT_NOT_READY_MESSAGE);
        const success = await updateRecurrenceTemplateEventData(recurrenceTemplateId, data);
        if (!isCurrent()) throw new Error("This series is no longer open.");
        if (!success) throw new Error("Failed to update recurrence template settings");
      };
      if (intent.kind === "maxTickets") {
        const previous = eventMaxTicketsPerTransaction;
        return { kind: "ready", operation: {
          apply: () => { if (isCurrent()) setEventMaxTicketsPerTransaction(intent.value); },
          rollback: () => { if (isCurrent()) setEventMaxTicketsPerTransaction(previous); },
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
      const control = controls[intent.key];
      return { kind: "ready", operation: {
        apply: () => { if (isCurrent()) control.set(intent.value); },
        rollback: () => { if (isCurrent()) control.set(control.value); },
        persist: () => persist({ [intent.key]: intent.value }),
      } };
    },
  });
  useEffect(() => {
    // Settings preparation must see the rendered reconciliation before accepting another commit.
    if (completedMutationCount > 0) mutationLockRef.current = false;
  }, [completedMutationCount]);
  const templateBusy = settings.isSaving || explicitMutationPending;
  const templateCommitBlocked = templateBusy || !accountReady;
  const failedSettingsIntent = isCurrentAccount() ? settings.failedIntent : null;
  const needsBookingRecovery = failedSettingsIntent?.kind === "boolean" && failedSettingsIntent.key === "paused" &&
    (!seriesState.statusAvailable || !seriesState.isActive);
  const needsStripeRecovery = failedSettingsIntent?.kind === "boolean" &&
    eventSettingRequiresStripe(failedSettingsIntent.key) &&
    !isStripeAccountActive(user.stripeAccountActive);

  useEffect(() => {
    if (!accountReady || !isCurrentAccount() || initialLoadStartedRef.current) return;
    initialLoadStartedRef.current = true;
    const isCurrent = () => lifetimeRef.current.active && isCurrentAccount();

    const load = async () => {
      try {
        const template = await getRecurrenceTemplate(recurrenceTemplateId);
        if (!isCurrent()) return;

        const { eventData, recurrenceData } = template;
        setEventName(eventData.name);
        setEventStartDate(eventData.startDate);
        setEventEndDate(eventData.endDate);
        const inventory = resolveEventInventory(eventData);
        setEventVacancy(inventory.vacancy);
        setEventDescription(eventData.description);
        setEventLocation(eventData.location);
        setEventSport(eventData.sport);
        setEventPrice(inventory.price);
        setEventImage(eventData.image);
        setEventThumbnail(eventData.thumbnail);
        setEventCapacity(inventory.capacity);
        setEventRegistrationDeadline(eventData.registrationDeadline);
        setEventEventLink(eventData.eventLink ?? "");
        setEventPaused(eventData.paused);
        setEventPaymentsActive(eventData.paymentsActive);
        setEventStripeFeeToCustomer(eventData.stripeFeeToCustomer);
        setEventPromotionalCodesEnabled(eventData.promotionalCodesEnabled);
        setEventHideVacancy(eventData.hideVacancy);
        setEventWaitlistEnabled(eventData.waitlistEnabled);
        setEventBookingApprovalEnabled(eventData.bookingApprovalEnabled);
        setEventShowAttendeesOnEventPage(eventData.showAttendeesOnEventPage);
        setEventIsPrivate(eventData.isPrivate);
        setEventTicketTypes(eventData.eventTicketTypes);
        setEventMaxTicketsPerTransaction(
          clampMaxTicketsPerTransaction(
            eventData.maxTicketsPerTransaction ?? DEFAULT_MAX_TICKETS_PER_ORDER,
            inventory.capacity
          )
        );

        const formData = extractNewRecurrenceFormDataFromRecurrenceData(recurrenceData);
        setFrequency(recurrenceData.frequency);
        setNewRecurrenceData(formData);
        setOriginalRecurrenceData(JSON.parse(JSON.stringify(formData)));
        setPastEvents(recurrenceData.pastRecurrences || {});

        const ended = calculateRecurrenceEnded(template);
        setSeriesState({ isActive: eventData.isActive, statusAvailable: true });
        setRecurrenceEnded(ended);
        if (ended) {
          setNewRecurrenceData({ ...formData, recurrenceEnabled: false });
        }
      } catch (error) {
        if (!isCurrent()) return;
        logger.error(`Failed to load recurrence template ${recurrenceTemplateId}: ${error}`);
        router.push("/error");
      } finally {
        if (isCurrent()) setLoading(false);
      }
    };

    void load();
  }, [accountReady, isCurrentAccount, recurrenceTemplateId, router]);

  const handleSectionChange = (next: RecurringHubSection) => {
    if (next === section) return;
    recurrenceSaveNoticeRequestRef.current += 1;
    setSaveNotice(null);
    setSectionReady(false);
    window.setTimeout(() => {
      setSection(next);
      setSectionReady(true);
    }, 120);
  };

  const submitNewRecurrenceData = async () => {
    if (!lifetimeRef.current.active) throw new Error("This series is no longer open.");
    if (accountRef.current.userLoading || !isCurrentAccount()) {
      setSaveNotice("account");
      throw new Error(ACCOUNT_NOT_READY_MESSAGE);
    }
    if (accountRef.current.loading) throw new Error("Wait for your series to finish loading, then save the schedule again.");
    if (mutationLockRef.current) {
      setSaveNotice("busy");
      throw new Error("Wait for the current change to finish, then save the schedule again.");
    }
    mutationLockRef.current = true;
    setExplicitMutationPending(true);
    const generation = lifetimeRef.current.generation;
    const isCurrent = () => lifetimeRef.current.active && lifetimeRef.current.generation === generation && isCurrentAccount();
    const submitted = { ...newRecurrenceData, reservedSlots: newRecurrenceData.reservedSlots?.map((slot) => ({ ...slot })) };
    const requestId = recurrenceSaveNoticeRequestRef.current + 1;
    recurrenceSaveNoticeRequestRef.current = requestId;
    setUpdatingRecurrenceData(true);
    setSaveNotice(null);
    try {
      await updateRecurrenceTemplateRecurrenceData(recurrenceTemplateId, submitted);
      if (!isCurrent()) throw new Error("This series is no longer open.");
      setOriginalRecurrenceData(submitted);
      setFrequency(submitted.frequency);
      try {
        const template = await getRecurrenceTemplate(recurrenceTemplateId);
        if (!isCurrent()) return;
        const ended = calculateRecurrenceEnded(template);
        setSeriesState({ isActive: template.eventData.isActive, statusAvailable: true });
        setRecurrenceEnded(ended);
      } catch (error) {
        if (!isCurrent()) return;
        logger.error(`Schedule saved but failed to refresh series status for ${recurrenceTemplateId}: ${error}`);
        setSeriesState((previous) => ({ ...previous, statusAvailable: false }));
      }
      if (recurrenceSaveNoticeRequestRef.current === requestId) {
        setSaveNotice("success");
      }
    } catch (error) {
      if (!isCurrent()) return;
      logger.error(`Failed to update recurrence data for ${recurrenceTemplateId}: ${error}`);
      if (recurrenceSaveNoticeRequestRef.current === requestId) {
        setSaveNotice("error");
      }
    } finally {
      if (lifetimeRef.current.active && lifetimeRef.current.generation === generation) {
        setExplicitMutationPending(false);
        setUpdatingRecurrenceData(false);
        setCompletedMutationCount((count) => count + 1);
      }
    }
  };

  const commitTemplateData = async (data: Partial<EventData>) => {
    if (!lifetimeRef.current.active) throw new Error("This series is no longer open.");
    if (accountRef.current.userLoading || !isCurrentAccount()) throw new Error(ACCOUNT_NOT_READY_MESSAGE);
    if (accountRef.current.loading) throw new Error("Wait for your series to finish loading, then save again.");
    if (mutationLockRef.current) throw new Error("Wait for the current change to finish, then save again.");
    mutationLockRef.current = true;
    setExplicitMutationPending(true);
    const generation = lifetimeRef.current.generation;
    const isCurrent = () => lifetimeRef.current.active && lifetimeRef.current.generation === generation && isCurrentAccount();
    try {
      const success = await updateRecurrenceTemplateEventData(recurrenceTemplateId, data);
      if (!success) throw new Error("Couldn’t save your changes. Please try again.");
      if (!isCurrent()) throw new Error("This series is no longer open.");
      if (data.name !== undefined) setEventName(data.name);
      if (data.description !== undefined) setEventDescription(data.description);
      if (data.location !== undefined) setEventLocation(data.location);
      if (data.sport !== undefined) setEventSport(data.sport);
      if (data.startDate !== undefined) setEventStartDate(data.startDate);
      if (data.endDate !== undefined) setEventEndDate(data.endDate);
      if (data.registrationDeadline !== undefined) setEventRegistrationDeadline(data.registrationDeadline);
      if (data.eventLink !== undefined) setEventEventLink(data.eventLink ?? "");
      if (data.image !== undefined) setEventImage(data.image);
      if (data.thumbnail !== undefined) setEventThumbnail(data.thumbnail);
      if (data.isPrivate !== undefined) setEventIsPrivate(data.isPrivate);
      if (data.eventTicketTypes !== undefined) {
        setEventTicketTypes(data.eventTicketTypes);
        const inventory = resolveEventInventory({ eventTicketTypes: data.eventTicketTypes });
        setEventCapacity(inventory.capacity);
        setEventVacancy(inventory.vacancy);
        setEventPrice(inventory.price);
      }
    } finally {
      if (lifetimeRef.current.active && lifetimeRef.current.generation === generation) {
        setExplicitMutationPending(false);
        setCompletedMutationCount((count) => count + 1);
      }
    }
  };

  const listingEventId = recurrenceTemplateId as unknown as EventId;
  const bookingStatus = !seriesState.statusAvailable
    ? "unavailable"
    : seriesState.isActive ? "active" : "inactive";

  return (
    <div className="min-h-screen bg-surface text-foreground pb-8">
      <div className="bg-background border-b border-border">
        <RecurringHubHeader
          loading={loading}
          name={eventName}
          startDate={eventStartDate}
          location={eventLocation}
          frequency={frequency}
        />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <SettingsSaveFeedback status={isCurrentAccount() ? settings.status : "idle"} errorMessage={settings.errorMessage} onRetry={() => void settings.retry()} retryDisabled={templateCommitBlocked} className={settings.status === "idle" ? "" : "pb-3"} />
          {!isCurrentAccount() ? <p role="status" className="pb-3 text-sm">{ACCOUNT_NOT_READY_MESSAGE}</p> : null}
          {needsStripeRecovery ? <ConnectStripeCta className="mb-3" /> : null}
          {needsBookingRecovery ? (
            <button type="button" onClick={seriesState.statusAvailable ? () => handleSectionChange("Recurrence") : () => window.location.reload()} className="mb-3 min-h-11 text-xs font-medium underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
              {seriesState.statusAvailable ? "Extend schedule" : "Reload page"}
            </button>
          ) : null}
        </div>
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
            commitBlocked={templateCommitBlocked}
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
            isActive={seriesState.isActive}
            isPrivate={eventIsPrivate}
            eventTicketTypes={eventTicketTypes}
            orderTicketsMap={EMPTY_ORDER_TICKETS_MAP}
            setEventTicketTypes={(types) => {
              if (!lifetimeRef.current.active || !isCurrentAccount()) return;
              setEventTicketTypes(types);
              const inventory = resolveEventInventory({ eventTicketTypes: types });
              setEventCapacity(inventory.capacity);
              setEventVacancy(inventory.vacancy);
              setEventPrice(inventory.price);
            }}
            onPersistTicketTypes={async (nextTypes) => {
              const general = findGeneralAdmissionTicketType(nextTypes);
              await commitTemplateData({
                eventTicketTypes: nextTypes,
                ...(general?.name === GENERAL_TICKET_TYPE_NAME
                  ? { formId: general.formId ?? null }
                  : {}),
              });
            }}
            mode="template"
            updateData={async (_id, data) => commitTemplateData(data)}
          />
        )}

        {section === "Past events" && <RecurringHubPastEvents pastEvents={pastEvents} />}

        {section === "Recurrence" && (
          <RecurringHubRecurrence
            loading={loading}
            updating={updatingRecurrenceData}
            saveBlocked={templateCommitBlocked}
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
            loading={loading}
            paused={eventPaused}
            saveSettings={settings.run}
            isSaving={templateCommitBlocked}
            seriesStatus={bookingStatus}
            onManageSchedule={() => handleSectionChange("Recurrence")}
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

      {saveNotice && isCurrentAccount() ? (
        <div
          role="status"
          className={`fixed left-4 right-4 sm:right-auto sm:max-w-md bottom-4 z-40 rounded-xl border px-4 py-3 text-sm font-sans shadow-sm ${
            saveNotice === "success"
              ? "border-border bg-background text-foreground"
              : "border-danger/30 bg-background text-danger"
          }`}
        >
          {saveNotice === "success"
            ? "Schedule saved."
            : saveNotice === "busy"
              ? "Wait for the current change to finish, then save the schedule again."
              : saveNotice === "account"
                ? ACCOUNT_NOT_READY_MESSAGE
                : "Failed to save schedule. Try again."}
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
