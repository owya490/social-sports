"use client";
import { LabelledSwitch } from "@/components/elements/LabelledSwitch";
import { RecurrenceTemplateId } from "@/interfaces/RecurringEventTypes";
import { updateRecurrenceTemplateEventData } from "@/services/src/recurringEvents/recurringEventsService";
import { Spinner } from "@material-tailwind/react";
import { useState } from "react";

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
}: RecurringTemplateSettingsProps) => {
  const [loading, setLoading] = useState<boolean>(false);
  return (
    <div className="relative">
      <div className="flex flex-col space-y-4 mb-6 px-4 md:px-0">
        <LabelledSwitch
          title={"Enable Event Payments"}
          description={"Enable for customers to purchase paid tickets for this event."}
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
      </div>
      {loading && (
        <div className="bg-core-hover opacity-50 top-0 absolute h-full w-full flex justify-center items-center">
          <Spinner className="w-8 h-8 opacity-100" />
        </div>
      )}
    </div>
  );
};
