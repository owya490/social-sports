"use client";
import { LabelledSwitch } from "@/components/elements/LabelledSwitch";
import { RecurrenceTemplateId } from "@/interfaces/RecurringEventTypes";
import { updateRecurrenceTemplateEventData } from "@/services/src/recurringEvents/recurringEventsService";
import { WAITLIST_ENABLED } from "@/services/src/waitlist/waitlistService";
import { BOOKING_APPROVAL_ENABLED } from "@/services/featureFlags";
import {
  clampMaxTicketsPerTransaction,
  getOrganiserMaxTicketsPerTransactionLimit,
  getTicketCountOptions,
} from "@/services/src/events/eventsUtils/ticketLimits";
import { Option, Select, Spinner } from "@material-tailwind/react";
import { useState } from "react";
import { isFreeEvent } from "@/utilities/priceUtils";

interface RecurringTemplateSettingsProps {
  recurrenceTemplateId: RecurrenceTemplateId;
  paymentsActive: boolean;
  setPaymentsActive: (event: boolean) => void;
  stripeFeeToCustomer: boolean;
  setStripeFeeToCustomer: (event: boolean) => void;
  promotionalCodesEnabled: boolean;
  setPromotionalCodesEnabled: (event: boolean) => void;
  hideVacancy: boolean;
  setHideVacancy: (event: boolean) => void;
  waitlistEnabled: boolean;
  setWaitlistEnabled: (event: boolean) => void;
  bookingApprovalEnabled: boolean;
  setBookingApprovalEnabled: (event: boolean) => void;
  showAttendeesOnEventPage: boolean;
  setShowAttendeesOnEventPage: (event: boolean) => void;
  maxTicketsPerTransaction: number;
  setMaxTicketsPerTransaction: (n: number) => void;
  eventCapacity: number;
  eventPrice: number;
}

export const RecurringTemplateSettings = ({
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
}: RecurringTemplateSettingsProps) => {
  const [loading, setLoading] = useState<boolean>(false);
  const isFree = isFreeEvent(eventPrice);

  const maxTicketsAllowed = getOrganiserMaxTicketsPerTransactionLimit(eventCapacity);

  const persistMaxTickets = async (next: number) => {
    const clamped = clampMaxTicketsPerTransaction(next, eventCapacity);
    setLoading(true);
    const success = await updateRecurrenceTemplateEventData(recurrenceTemplateId, {
      maxTicketsPerTransaction: clamped,
    });
    if (success) {
      setMaxTicketsPerTransaction(clamped);
      setLoading(false);
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="relative">
      <div className="flex flex-col space-y-4 mb-6 px-4 md:px-0">
        <LabelledSwitch
          title={isFree ? "Enable Event Bookings" : "Enable Event Payments"}
          description={
            isFree
              ? "Enable for customers to book spots for this event."
              : "Enable for customers to purchase paid tickets for this event."
          }
          state={paymentsActive}
          setState={setPaymentsActive}
          updateData={async (event: boolean) => {
            setLoading(true);
            const success = await updateRecurrenceTemplateEventData(recurrenceTemplateId, {
              paymentsActive: event,
            });
            if (success) {
              setLoading(false);
            } else {
              window.location.reload();
            }
          }}
        />
        {!isFree && (
          <>
            <LabelledSwitch
              title={"Pass Stripe Fee to Customer"}
              description={
                "Once enabled, card surcharges and Stripe fees will be added at checkout and paid by the customer."
              }
              state={stripeFeeToCustomer}
              setState={setStripeFeeToCustomer}
              updateData={async (event: boolean) => {
                setLoading(true);
                const success = await updateRecurrenceTemplateEventData(recurrenceTemplateId, {
                  stripeFeeToCustomer: event,
                });
                if (success) {
                  setLoading(false);
                } else {
                  window.location.reload();
                }
              }}
            />
            <LabelledSwitch
              title={"Enable Promotional Codes"}
              description={"Enable to allow customers to apply promotional codes at checkout."}
              state={promotionalCodesEnabled}
              setState={setPromotionalCodesEnabled}
              updateData={async (event: boolean) => {
                setLoading(true);
                const success = await updateRecurrenceTemplateEventData(recurrenceTemplateId, {
                  promotionalCodesEnabled: event,
                });
                if (success) {
                  setLoading(false);
                } else {
                  window.location.reload();
                }
              }}
            />
          </>
        )}
        <LabelledSwitch
          title={"Hide Vacancy"}
          description={"Enable to hide the vacant ticket count from the event page."}
          state={hideVacancy}
          setState={setHideVacancy}
          updateData={async (event: boolean) => {
            setLoading(true);
            const success = await updateRecurrenceTemplateEventData(recurrenceTemplateId, {
              hideVacancy: event,
            });
            if (success) {
              setLoading(false);
            } else {
              window.location.reload();
            }
          }}
        />
        {WAITLIST_ENABLED && (
          <LabelledSwitch
            title={"Enable Waitlist"}
            description={"Enable to allow customers to join a waitlist for this event."}
            state={waitlistEnabled}
            setState={setWaitlistEnabled}
            updateData={async (event: boolean) => {
              setLoading(true);
              const success = await updateRecurrenceTemplateEventData(recurrenceTemplateId, {
                waitlistEnabled: event,
              });
              if (success) {
                setLoading(false);
              } else {
                window.location.reload();
              }
            }}
          />
        )}
        {BOOKING_APPROVAL_ENABLED && (
          <LabelledSwitch
            title={"Enable Booking Approval"}
            description={"Enable to require manual approval for bookings before they are confirmed."}
            state={bookingApprovalEnabled}
            setState={setBookingApprovalEnabled}
            updateData={async (event: boolean) => {
              setLoading(true);
              const success = await updateRecurrenceTemplateEventData(recurrenceTemplateId, {
                bookingApprovalEnabled: event,
              });
              if (success) {
                setLoading(false);
              } else {
                window.location.reload();
              }
            }}
          />
        )}
        <LabelledSwitch
          title={"Show Attendees on Event Page"}
          description={"Display registered attendees on the public event page."}
          state={showAttendeesOnEventPage}
          setState={setShowAttendeesOnEventPage}
          updateData={async (event: boolean) => {
            setLoading(true);
            const success = await updateRecurrenceTemplateEventData(recurrenceTemplateId, {
              showAttendeesOnEventPage: event,
            });
            if (success) {
              setLoading(false);
            } else {
              window.location.reload();
            }
          }}
        />
        <div className="flex w-full flex-col gap-3">
          <div>
            <h3 className="font-bold">Max Tickets Per Transaction</h3>
            <p className="text-core-text font-light text-sm">
              Maximum number of tickets a customer can purchase in a single transaction (up to{" "}
              {maxTicketsAllowed} for this template).
            </p>
          </div>
          <Select
            className="text-black"
            containerProps={{ className: "w-28" }}
            label="Tickets"
            value={`${maxTicketsPerTransaction}`}
            onChange={(value) => {
              if (!value) {
                return;
              }
              const n = Number(value);
              if (!Number.isFinite(n)) {
                return;
              }
              void persistMaxTickets(n);
            }}
          >
            {getTicketCountOptions(maxTicketsAllowed).map((count) => (
              <Option key={`max-tickets-option-${count}`} value={`${count}`}>
                {count}
              </Option>
            ))}
          </Select>
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Spinner className="h-4 w-4" />
            <span>Saving...</span>
          </div>
        )}
      </div>
    </div>
  );
};
