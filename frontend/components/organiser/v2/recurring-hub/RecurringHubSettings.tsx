"use client";

import {
  EventHubPreferenceRow,
  EventHubSettingTile,
  EventHubSettingTileRow,
  EventHubStage,
} from "@/components/organiser/v2/event-hub/EventHubStage";
import { EventBooleanSettingKey, RecurringSettingsIntent } from "@/components/organiser/v2/shared/eventSettingsIntent";
import { SettingsAutosaveResult } from "@/components/organiser/v2/shared/useSettingsAutosave";
import { ConnectStripeCta } from "@/components/organiser/v2/settings/ConnectStripeCta";
import { useUser } from "@/components/utility/UserContext";
import {
  getOrganiserMaxTicketsPerTransactionLimit,
  getTicketCountOptions,
} from "@/services/src/events/eventsUtils/ticketLimits";
import { isStripeAccountActive } from "@/services/src/stripe/stripeUtils";
import { WAITLIST_ENABLED } from "@/services/src/waitlist/waitlistService";
import { isFreeEvent } from "@/utilities/priceUtils";
import {
  CheckBadgeIcon,
  CreditCardIcon,
  QueueListIcon,
  TicketIcon,
} from "@heroicons/react/24/outline";
import { ReactNode, useId } from "react";
import Skeleton from "react-loading-skeleton";
import { RecurringSeriesStatus } from "./recurringHubTypes";

type RecurringHubSettingsProps = {
  loading: boolean;
  paused: boolean;
  seriesStatus: RecurringSeriesStatus;
  onManageSchedule: () => void;
  paymentsActive: boolean;
  stripeFeeToCustomer: boolean;
  promotionalCodesEnabled: boolean;
  hideVacancy: boolean;
  waitlistEnabled: boolean;
  bookingApprovalEnabled: boolean;
  showAttendeesOnEventPage: boolean;
  maxTicketsPerTransaction: number;
  saveSettings: (intent: RecurringSettingsIntent) => Promise<SettingsAutosaveResult>;
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

export function RecurringHubSettings({
  loading,
  paused,
  seriesStatus,
  onManageSchedule,
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
}: RecurringHubSettingsProps) {
  const { user } = useUser();
  const isFree = isFreeEvent(eventPrice);
  const maxTicketsAllowed = getOrganiserMaxTicketsPerTransactionLimit(eventCapacity);
  const stripeReady = isStripeAccountActive(user.stripeAccountActive);
  const paymentsLockedDescription = "Connect Stripe to enable this setting.";
  const bookingHelpId = useId();

  if (loading) {
    return (
      <EventHubStage className="space-y-4">
        <Skeleton height={20} width="70%" />
        <Skeleton count={4} height={48} />
      </EventHubStage>
    );
  }

  const persistToggle = (key: EventBooleanSettingKey) => (value: boolean) => {
    void saveSettings({ kind: "boolean", key, value });
  };

  return (
    <EventHubStage>
      <p className="mb-6 text-sm text-foreground-secondary font-sans leading-relaxed">
        These settings apply to newly created events. Existing events stay unchanged.
      </p>
      <div className="space-y-2">
        <SettingsGroup title="Registration" flush>
          <EventHubSettingTileRow className="items-start">
            <div className="flex w-full min-w-0 flex-none flex-col sm:w-auto sm:min-w-[12rem] sm:flex-1">
              <EventHubSettingTile
                title="Bookings on new events"
                descriptionId={bookingHelpId}
                icon={<TicketIcon />}
                tone="green"
                checked={!paused}
                disabled={isSaving}
                locked={seriesStatus !== "active"}
                onLabel="Open"
                offLabel="Paused"
                onChange={(open) => persistToggle("paused")(!open)}
              />
              <div className="mt-1 flex flex-wrap items-center gap-x-3">
                <p id={bookingHelpId} className="text-xs text-foreground-secondary font-sans leading-relaxed">
                  {seriesStatus === "active"
                    ? "Pausing bookings does not stop event creation."
                    : seriesStatus === "inactive"
                      ? "Series inactive."
                      : "Status unavailable."}
                </p>
                {seriesStatus !== "active" ? (
                  <button
                    type="button"
                    onClick={seriesStatus === "inactive" ? onManageSchedule : () => window.location.reload()}
                    className="inline-flex min-h-11 items-center text-xs font-medium text-foreground font-sans underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  >
                    {seriesStatus === "inactive" ? "Extend schedule" : "Reload page"}
                  </button>
                ) : null}
              </div>
            </div>
            <EventHubSettingTile
              title={isFree ? "Accept bookings" : "Accept payments"}
              description={
                !stripeReady
                  ? paymentsLockedDescription
                  : isFree
                    ? "Allow customers to book spots on future occurrences."
                    : "Allow customers to purchase paid tickets on future occurrences."
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
                description="Allow customers to join a waitlist when an occurrence is full."
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
                Cap how many tickets one customer can buy at once (up to {maxTicketsAllowed} for this
                template).
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
      </div>
    </EventHubStage>
  );
}
