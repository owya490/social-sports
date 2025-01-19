import { updateEventById } from "@/services/src/events/eventsService";
import { LabelledSwitch } from "../../../elements/LabelledSwitch";

interface EventDrilldownSettingsPageProps {
  eventId: string;
  paused: boolean;
  setPaused: (event: boolean) => void;
  paymentsActive: boolean;
  setPaymentsActive: (event: boolean) => void;
  stripeFeeToCustomer: boolean;
  setStripeFeeToCustomer: (event: boolean) => void;
  promotionalCodesEnabled: boolean;
  setPromotionalCodesEnabled: (event: boolean) => void;
}

const EventDrilldownSettingsPage = ({
  eventId,
  paused,
  setPaused,
  paymentsActive,
  setPaymentsActive,
  stripeFeeToCustomer,
  setStripeFeeToCustomer,
  promotionalCodesEnabled,
  setPromotionalCodesEnabled,
}: EventDrilldownSettingsPageProps) => {
  return (
    <div className="flex flex-col space-y-4 mb-6 px-4 md:px-0">
      <LabelledSwitch
        title={"Pause Event Registration"}
        description={"If enabled, event registration will be closed."}
        state={paused}
        setState={setPaused}
        updateData={(event: boolean) => {
          updateEventById(eventId, {
            paused: event,
          });
        }}
      />
      <LabelledSwitch
        title={"Enable Event Payments"}
        description={"Enable for customers to purchase paid tickets for this event."}
        state={paymentsActive}
        setState={setPaymentsActive}
        updateData={(event: boolean) => {
          updateEventById(eventId, {
            paymentsActive: event,
          });
        }}
      />
      <LabelledSwitch
        title={"Pass Stripe Fee to Customer"}
        description={
          "Once enabled, card surcharges and Stripe fees will be added at checkout and paid by the customer."
        }
        state={stripeFeeToCustomer}
        setState={setStripeFeeToCustomer}
        updateData={(event: boolean) => {
          updateEventById(eventId, {
            stripeFeeToCustomer: event,
          });
        }}
      />
      <LabelledSwitch
        title={"Enable Promotional Codes"}
        description={"Enable to allow customers to apply promotional codes at checkout."}
        state={promotionalCodesEnabled}
        setState={setPromotionalCodesEnabled}
        updateData={(event: boolean) => {
          updateEventById(eventId, {
            promotionalCodesEnabled: event,
          });
        }}
      />
    </div>
  );
};

export default EventDrilldownSettingsPage;
