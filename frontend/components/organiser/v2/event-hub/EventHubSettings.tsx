"use client";

import DeleteEventModal from "@/components/organiser/event/settings/DeleteEventModal";
import { useUser } from "@/components/utility/UserContext";
import { EventData, EventId } from "@/interfaces/EventTypes";
import { Order } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { Logger } from "@/observability/logger";
import { archiveAndDeleteEvent, updateEventById } from "@/services/src/events/eventsService";
import { bustEventsLocalStorageCache } from "@/services/src/events/eventsUtils/getEventsUtils";
import {
  clampMaxTicketsPerTransaction,
  getOrganiserMaxTicketsPerTransactionLimit,
  getTicketCountOptions,
} from "@/services/src/events/eventsUtils/ticketLimits";
import { sendEmailOnDeleteEventV2 } from "@/services/src/loops/loopsService";
import { WAITLIST_ENABLED } from "@/services/src/waitlist/waitlistService";
import { isFreeEvent } from "@/utilities/priceUtils";
import { Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { ReactNode, useMemo, useState } from "react";
import {
  EventHubPreferenceRow,
  EventHubStage,
} from "./EventHubStage";

type EventHubSettingsProps = {
  eventId: EventId;
  orderTicketsMap: Map<Order, Ticket[]>;
  eventName: string;
  eventStartDate: Timestamp;
  paused: boolean;
  setPaused: (value: boolean) => void;
  paymentsActive: boolean;
  setPaymentsActive: (value: boolean) => void;
  stripeFeeToCustomer: boolean;
  setStripeFeeToCustomer: (value: boolean) => void;
  promotionalCodesEnabled: boolean;
  setPromotionalCodesEnabled: (value: boolean) => void;
  hideVacancy: boolean;
  setHideVacancy: (value: boolean) => void;
  waitlistEnabled: boolean;
  setWaitlistEnabled: (value: boolean) => void;
  bookingApprovalEnabled: boolean;
  setBookingApprovalEnabled: (value: boolean) => void;
  showAttendeesOnEventPage: boolean;
  setShowAttendeesOnEventPage: (value: boolean) => void;
  maxTicketsPerTransaction: number;
  setMaxTicketsPerTransaction: (n: number) => void;
  eventCapacity: number;
  eventPrice: number;
};

function SettingsGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="pt-6 first:pt-0">
      <h3 className="text-sm font-semibold text-foreground font-sans mb-1">{title}</h3>
      <div className="divide-y divide-border border-t border-border">{children}</div>
    </section>
  );
}

export function EventHubSettings({
  eventId,
  orderTicketsMap,
  eventName,
  eventStartDate,
  paused,
  setPaused,
  paymentsActive,
  setPaymentsActive,
  stripeFeeToCustomer,
  setStripeFeeToCustomer,
  promotionalCodesEnabled,
  setPromotionalCodesEnabled,
  hideVacancy,
  setHideVacancy,
  waitlistEnabled,
  setWaitlistEnabled,
  bookingApprovalEnabled,
  setBookingApprovalEnabled,
  showAttendeesOnEventPage,
  setShowAttendeesOnEventPage,
  maxTicketsPerTransaction,
  setMaxTicketsPerTransaction,
  eventCapacity,
  eventPrice,
}: EventHubSettingsProps) {
  const router = useRouter();
  const { user, auth } = useUser();
  const logger = useMemo(() => new Logger("EventHubSettings"), []);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const maxTicketsAllowed = getOrganiserMaxTicketsPerTransactionLimit(eventCapacity);
  const isFree = isFreeEvent(eventPrice);

  const saveEventSettings = async (data: Partial<EventData>) => {
    setSaving(true);
    try {
      await updateEventById(eventId, data);
    } finally {
      setSaving(false);
    }
  };

  const persistToggle =
    (setLocal: (v: boolean) => void, key: keyof EventData) => async (next: boolean) => {
      setLocal(next);
      await saveEventSettings({ [key]: next } as Partial<EventData>);
    };

  const persistMaxTickets = (next: number) => {
    const clamped = clampMaxTicketsPerTransaction(next, eventCapacity);
    setMaxTicketsPerTransaction(clamped);
    void saveEventSettings({ maxTicketsPerTransaction: clamped });
  };

  const onConfirm = async () => {
    try {
      setDeleteLoading(true);
      await archiveAndDeleteEvent(eventId, user.userId, auth.currentUser?.email || "");
      await sendEmailOnDeleteEventV2(eventId);
      bustEventsLocalStorageCache();
      setDeleteLoading(false);
      router.push("/organiser/v2/event/dashboard");
    } catch (error) {
      if (error === "Rate Limited") {
        router.push("/error/Delete_UPDATE_EVENT_RATELIMITED");
      } else if (error == "Loops failed") {
        logger.error("Loops failed");
      } else {
        router.push("/error");
      }
    }
  };

  return (
    <EventHubStage>
      {saving ? (
        <p className="text-xs text-foreground-muted font-sans pb-2" aria-live="polite">
          Saving…
        </p>
      ) : null}

      <div className="space-y-2">
        <SettingsGroup title="Registration">
          <EventHubPreferenceRow
            title="Pause registration"
            description="Close new bookings while keeping the listing visible."
            checked={paused}
            onChange={persistToggle(setPaused, "paused")}
          />
          <EventHubPreferenceRow
            title={isFree ? "Enable bookings" : "Enable payments"}
            description={
              isFree
                ? "Allow customers to book spots for this event."
                : "Allow customers to purchase paid tickets for this event."
            }
            checked={paymentsActive}
            onChange={persistToggle(setPaymentsActive, "paymentsActive")}
          />
          <EventHubPreferenceRow
            title="Booking approval"
            description="Require manual approval before bookings are confirmed."
            checked={bookingApprovalEnabled}
            onChange={persistToggle(setBookingApprovalEnabled, "bookingApprovalEnabled")}
          />
          {WAITLIST_ENABLED ? (
            <EventHubPreferenceRow
              title="Waitlist"
              description="Allow customers to join a waitlist when the event is full."
              checked={waitlistEnabled}
              onChange={persistToggle(setWaitlistEnabled, "waitlistEnabled")}
            />
          ) : null}
        </SettingsGroup>

        {!isFree ? (
          <SettingsGroup title="Checkout">
            <EventHubPreferenceRow
              title="Pass Stripe fee to customer"
              description="Add card surcharges and Stripe fees at checkout for the customer to pay."
              checked={stripeFeeToCustomer}
              onChange={persistToggle(setStripeFeeToCustomer, "stripeFeeToCustomer")}
            />
            <EventHubPreferenceRow
              title="Promotional codes"
              description="Let customers apply promotional codes at checkout."
              checked={promotionalCodesEnabled}
              onChange={persistToggle(setPromotionalCodesEnabled, "promotionalCodesEnabled")}
            />
          </SettingsGroup>
        ) : null}

        <SettingsGroup title="Visibility">
          <EventHubPreferenceRow
            title="Hide vacancy"
            description="Hide remaining ticket count on the public event page."
            checked={hideVacancy}
            onChange={persistToggle(setHideVacancy, "hideVacancy")}
          />
          <EventHubPreferenceRow
            title="Show attendees on event page"
            description="Display registered attendees on the public listing."
            checked={showAttendeesOnEventPage}
            onChange={persistToggle(setShowAttendeesOnEventPage, "showAttendeesOnEventPage")}
          />
        </SettingsGroup>

        <SettingsGroup title="Limits">
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 py-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground font-sans">Max tickets per transaction</p>
              <p className="mt-1 text-xs text-foreground-muted font-sans leading-relaxed">
                Cap how many tickets one customer can buy at once (up to {maxTicketsAllowed} for this event).
              </p>
            </div>
            <label className="shrink-0">
              <span className="sr-only">Max tickets per transaction</span>
              <select
                value={maxTicketsPerTransaction}
                onChange={(e) => persistMaxTickets(Number(e.target.value))}
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground font-sans focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                {getTicketCountOptions(maxTicketsAllowed).map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </SettingsGroup>

        <SettingsGroup title="Danger zone">
          <div className="py-4">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="text-sm font-medium text-danger font-sans hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus rounded"
            >
              Delete event
            </button>
            <p className="mt-1.5 text-xs text-foreground-muted font-sans">
              Permanently remove this event and notify attendees.
            </p>
          </div>
        </SettingsGroup>
      </div>

      <DeleteEventModal
        eventName={eventName}
        eventStartDate={eventStartDate}
        orderTicketsMap={orderTicketsMap}
        modalOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={onConfirm}
        loading={deleteLoading}
      />
    </EventHubStage>
  );
}
