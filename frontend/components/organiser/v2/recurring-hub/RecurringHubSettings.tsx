"use client";

import {
  EventHubPreferenceRow,
  EventHubStage,
} from "@/components/organiser/v2/event-hub/EventHubStage";
import { NewEventData } from "@/interfaces/EventTypes";
import { RecurrenceTemplateId } from "@/interfaces/RecurringEventTypes";
import {
  clampMaxTicketsPerTransaction,
  getOrganiserMaxTicketsPerTransactionLimit,
  getTicketCountOptions,
} from "@/services/src/events/eventsUtils/ticketLimits";
import { updateRecurrenceTemplateEventData } from "@/services/src/recurringEvents/recurringEventsService";
import { WAITLIST_ENABLED } from "@/services/src/waitlist/waitlistService";
import { isFreeEvent } from "@/utilities/priceUtils";
import { ReactNode, useState } from "react";

type RecurringHubSettingsProps = {
  recurrenceTemplateId: RecurrenceTemplateId;
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

export function RecurringHubSettings({
  recurrenceTemplateId,
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
}: RecurringHubSettingsProps) {
  const [saving, setSaving] = useState(false);
  const isFree = isFreeEvent(eventPrice);
  const maxTicketsAllowed = getOrganiserMaxTicketsPerTransactionLimit(eventCapacity);

  const save = async (data: Partial<NewEventData>) => {
    setSaving(true);
    try {
      const success = await updateRecurrenceTemplateEventData(recurrenceTemplateId, data);
      if (!success) {
        window.location.reload();
      }
    } finally {
      setSaving(false);
    }
  };

  const persistToggle =
    (setLocal: (v: boolean) => void, key: keyof NewEventData) => async (next: boolean) => {
      setLocal(next);
      await save({ [key]: next } as Partial<NewEventData>);
    };

  const persistMaxTickets = (next: number) => {
    const clamped = clampMaxTicketsPerTransaction(next, eventCapacity);
    setMaxTicketsPerTransaction(clamped);
    void save({ maxTicketsPerTransaction: clamped });
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
            title={isFree ? "Enable bookings" : "Enable payments"}
            description={
              isFree
                ? "Allow customers to book spots on future occurrences."
                : "Allow customers to purchase paid tickets on future occurrences."
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
              description="Allow customers to join a waitlist when an occurrence is full."
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
                Cap how many tickets one customer can buy at once (up to {maxTicketsAllowed} for this
                template).
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
      </div>
    </EventHubStage>
  );
}
