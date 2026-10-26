"use client";

import DeleteEventModal from "@/components/organiser/event/settings/DeleteEventModal";
import { ConnectStripeCta } from "@/components/organiser/v2/settings/ConnectStripeCta";
import { EventBooleanSettingKey, EventSettingsIntent } from "@/components/organiser/v2/shared/eventSettingsIntent";
import { SettingsAutosaveResult } from "@/components/organiser/v2/shared/useSettingsAutosave";
import { useUser } from "@/components/utility/UserContext";
import { EventId } from "@/interfaces/EventTypes";
import { Order } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { Logger } from "@/observability/logger";
import { archiveAndDeleteEvent } from "@/services/src/events/eventsService";
import { bustEventsLocalStorageCache } from "@/services/src/events/eventsUtils/getEventsUtils";
import { bustOrganiserEventsCache } from "@/services/src/organiser/organiserEventsService";
import {
  getOrganiserMaxTicketsPerTransactionLimit,
  getTicketCountOptions,
} from "@/services/src/events/eventsUtils/ticketLimits";
import { sendEmailOnDeleteEventV2 } from "@/services/src/loops/loopsService";
import { isStripeAccountActive } from "@/services/src/stripe/stripeUtils";
import { WAITLIST_ENABLED } from "@/services/src/waitlist/waitlistService";
import { isFreeEvent } from "@/utilities/priceUtils";
import {
  CheckBadgeIcon,
  CreditCardIcon,
  QueueListIcon,
  TicketIcon,
} from "@heroicons/react/24/outline";
import { Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { ReactNode, useMemo, useState } from "react";
import {
  EventHubPreferenceRow,
  EventHubSettingTile,
  EventHubSettingTileRow,
  EventHubStage,
} from "./EventHubStage";

type EventHubSettingsProps = {
  eventId: EventId;
  orderTicketsMap: Map<Order, Ticket[]>;
  eventName: string;
  eventStartDate: Timestamp;
  paused: boolean;
  paymentsActive: boolean;
  stripeFeeToCustomer: boolean;
  promotionalCodesEnabled: boolean;
  hideVacancy: boolean;
  waitlistEnabled: boolean;
  bookingApprovalEnabled: boolean;
  showAttendeesOnEventPage: boolean;
  maxTicketsPerTransaction: number;
  saveSettings: (intent: EventSettingsIntent) => Promise<SettingsAutosaveResult>;
  isSaving: boolean;
  eventCapacity: number;
  eventPrice: number;
};

function SettingsGroup({
  title,
  children,
  flush,
}: {
  title: string;
  children: ReactNode;
  flush?: boolean;
}) {
  return (
    <section className="pt-6 first:pt-0">
      <h3 className="text-sm font-semibold text-foreground font-sans mb-1">{title}</h3>
      {flush ? (
        <div className="border-t border-border">{children}</div>
      ) : (
        <div className="divide-y divide-border border-t border-border">{children}</div>
      )}
    </section>
  );
}

export function EventHubSettings({
  eventId,
  orderTicketsMap,
  eventName,
  eventStartDate,
  paused,
  paymentsActive,
  stripeFeeToCustomer,
  promotionalCodesEnabled,
  hideVacancy,
  waitlistEnabled,
  bookingApprovalEnabled,
  showAttendeesOnEventPage,
  maxTicketsPerTransaction,
  saveSettings,
  isSaving,
  eventCapacity,
  eventPrice,
}: EventHubSettingsProps) {
  const router = useRouter();
  const { user, auth } = useUser();
  const logger = useMemo(() => new Logger("EventHubSettings"), []);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const maxTicketsAllowed = getOrganiserMaxTicketsPerTransactionLimit(eventCapacity);
  const isFree = isFreeEvent(eventPrice);
  const stripeReady = isStripeAccountActive(user.stripeAccountActive);
  const paymentsLockedDescription = "Connect Stripe to enable this setting.";

  const persistToggle = (key: EventBooleanSettingKey) => (value: boolean) => {
    void saveSettings({ kind: "boolean", key, value });
  };

  const onConfirm = async () => {
    try {
      setDeleteLoading(true);
      await archiveAndDeleteEvent(eventId, user.userId, auth.currentUser?.email || "");
      await sendEmailOnDeleteEventV2(eventId);
      bustEventsLocalStorageCache();
      bustOrganiserEventsCache();
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
      <div className="space-y-2">
        <SettingsGroup title="Registration" flush>
          <EventHubSettingTileRow>
            <EventHubSettingTile
              title="Registration"
              description="Close new bookings while keeping the listing visible."
              icon={<TicketIcon />}
              tone="green"
              checked={!paused}
              disabled={isSaving}
              onLabel="Open"
              offLabel="Paused"
              onChange={(open) => persistToggle("paused")(!open)}
            />
            <EventHubSettingTile
              title={isFree ? "Bookings" : "Payments"}
              description={
                !stripeReady
                  ? paymentsLockedDescription
                  : isFree
                    ? "Allow customers to book spots for this event."
                    : "Allow customers to purchase paid tickets for this event."
              }
              icon={isFree ? <TicketIcon /> : <CreditCardIcon />}
              tone="stripe"
              checked={stripeReady && paymentsActive}
              disabled={!stripeReady || isSaving}
              onLabel="On"
              offLabel="Off"
              onChange={persistToggle("paymentsActive")}
            />
            <EventHubSettingTile
              title="Booking approval"
              description={
                stripeReady
                  ? "Require manual approval before bookings are confirmed."
                  : paymentsLockedDescription
              }
              icon={<CheckBadgeIcon />}
              tone="blue"
              checked={stripeReady && bookingApprovalEnabled}
              disabled={!stripeReady || isSaving}
              onLabel="On"
              offLabel="Off"
              onChange={persistToggle("bookingApprovalEnabled")}
            />
            {WAITLIST_ENABLED ? (
              <EventHubSettingTile
                title="Waitlist"
                description="Allow customers to join a waitlist when the event is full."
                icon={<QueueListIcon />}
                tone="sky"
                checked={waitlistEnabled}
                disabled={isSaving}
                onLabel="On"
                offLabel="Off"
                onChange={persistToggle("waitlistEnabled")}
              />
            ) : null}
          </EventHubSettingTileRow>
          {!stripeReady ? <ConnectStripeCta className="mt-3 mb-1" /> : null}
        </SettingsGroup>

        {!isFree ? (
          <SettingsGroup title="Checkout">
            <EventHubPreferenceRow
              title="Pass Stripe fee to customer"
              description="Add card surcharges and Stripe fees at checkout for the customer to pay."
              checked={stripeFeeToCustomer}
              disabled={!stripeReady || isSaving}
              onChange={persistToggle("stripeFeeToCustomer")}
            />
            <EventHubPreferenceRow
              title="Promotional codes"
              description="Let customers apply promotional codes at checkout."
              checked={promotionalCodesEnabled}
              disabled={!stripeReady || isSaving}
              onChange={persistToggle("promotionalCodesEnabled")}
            />
          </SettingsGroup>
        ) : null}

        <SettingsGroup title="Visibility">
          <EventHubPreferenceRow
            title="Hide vacancy"
            description="Hide remaining ticket count on the public event page."
            checked={hideVacancy}
            disabled={isSaving}
            onChange={persistToggle("hideVacancy")}
          />
          <EventHubPreferenceRow
            title="Show attendees on event page"
            description="Display registered attendees on the public listing."
            checked={showAttendeesOnEventPage}
            disabled={isSaving}
            onChange={persistToggle("showAttendeesOnEventPage")}
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
                onChange={(e) => void saveSettings({ kind: "maxTickets", value: Number(e.target.value) })}
                disabled={isSaving}
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground font-sans focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-60"
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
