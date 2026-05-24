import { BlackHighlightButton } from "@/components/elements/HighlightButton";
import { useUser } from "@/components/utility/UserContext";
import { EventData, EventId } from "@/interfaces/EventTypes";
import { Order } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { Logger } from "@/observability/logger";
import { BOOKING_APPROVAL_ENABLED } from "@/services/featureFlags";
import { archiveAndDeleteEvent, updateEventById } from "@/services/src/events/eventsService";
import { bustEventsLocalStorageCache } from "@/services/src/events/eventsUtils/getEventsUtils";
import {
  clampMaxTicketsPerTransaction,
  getOrganiserMaxTicketsPerTransactionLimit,
  getTicketCountOptions,
} from "@/services/src/events/eventsUtils/ticketLimits";
import { sendEmailOnDeleteEventV2 } from "@/services/src/loops/loopsService";
import { WAITLIST_ENABLED } from "@/services/src/waitlist/waitlistService";
import { Option, Select, Spinner } from "@material-tailwind/react";
import { Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LabelledSwitch } from "../../../elements/LabelledSwitch";
import DeleteEventModal from "./DeleteEventModal";
import { isFreeEvent } from "@/utilities/priceUtils";

interface EventDrilldownSettingsPageProps {
  eventId: EventId;
  orderTicketsMap: Map<Order, Ticket[]>;
  eventName: string;
  eventStartDate: Timestamp;
  router: ReturnType<typeof useRouter>;
  paused: boolean;
  setPaused: (event: boolean) => void;
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

const EventDrilldownSettingsPage = ({
  eventId,
  orderTicketsMap,
  eventName,
  eventStartDate,
  router,
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
}: EventDrilldownSettingsPageProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { user, auth } = useUser();
  const logger = new Logger("EventDrilldownSettingsLogger");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const onClose = () => {
    setModalOpen(false);
  };

  const onConfirm = async () => {
    try {
      setDeleteLoading(true);
      await archiveAndDeleteEvent(eventId, user.userId, auth.currentUser?.email || "");
      await sendEmailOnDeleteEventV2(eventId);
      bustEventsLocalStorageCache();
      setDeleteLoading(false);
      router.push("/organiser/event/dashboard");
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

  const handleDeleteEvent = () => {
    setModalOpen(true);
  };

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

  const persistMaxTickets = (next: number) => {
    const clamped = clampMaxTicketsPerTransaction(next, eventCapacity);
    setMaxTicketsPerTransaction(clamped);
    void saveEventSettings({ maxTicketsPerTransaction: clamped });
  };

  return (
    <div className="flex flex-col space-y-4 mb-6 px-4 md:px-0">
      <LabelledSwitch
        title={"Pause Event Registration"}
        description={"If enabled, event registration will be closed."}
        state={paused}
        setState={setPaused}
        updateData={(event: boolean) => {
          void saveEventSettings({
            paused: event,
          });
        }}
      />
      <LabelledSwitch
        title={isFree ? "Enable Event Bookings" : "Enable Event Payments"}
        description={
          isFree
            ? "Enable for customers to book spots for this event."
            : "Enable for customers to purchase paid tickets for this event."
        }
        state={paymentsActive}
        setState={setPaymentsActive}
        updateData={(event: boolean) => {
          void saveEventSettings({
            paymentsActive: event,
          });
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
            updateData={(event: boolean) => {
              void saveEventSettings({
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
              void saveEventSettings({
                promotionalCodesEnabled: event,
              });
            }}
          />
        </>
      )}
      <LabelledSwitch
        title={"Hide Vacancy"}
        description={"Enable to hide the vacant ticket count from the event page."}
        state={hideVacancy}
        setState={setHideVacancy}
        updateData={(event: boolean) => {
          void saveEventSettings({
            hideVacancy: event,
          });
        }}
      />
      {WAITLIST_ENABLED && (
        <LabelledSwitch
          title={"Enable Waitlist"}
          description={"Enable to allow customers to join a waitlist for this event."}
          state={waitlistEnabled}
          setState={setWaitlistEnabled}
          updateData={(event: boolean) => {
            void saveEventSettings({
              waitlistEnabled: event,
            });
          }}
        />
      )}
      {BOOKING_APPROVAL_ENABLED && (
        <LabelledSwitch
          title={"Enable Booking Approval"}
          description={"Enable to require manual approval for bookings before they are confirmed."}
          state={bookingApprovalEnabled}
          setState={setBookingApprovalEnabled}
          updateData={(event: boolean) => {
            void saveEventSettings({
              bookingApprovalEnabled: event,
            });
          }}
        />
      )}
      <LabelledSwitch
        title={"Show Attendees on Event Page"}
        description={"Display registered attendees on the public event page."}
        state={showAttendeesOnEventPage}
        setState={setShowAttendeesOnEventPage}
        updateData={(event: boolean) => {
          void saveEventSettings({
            showAttendeesOnEventPage: event,
          });
        }}
      />
      <div className="flex w-full flex-col gap-3">
        <div>
          <h3 className="font-bold">Max Tickets Per Transaction</h3>
          <p className="text-core-text font-light text-sm">
            Maximum number of tickets a customer can purchase in a single transaction (up to{" "}
            {maxTicketsAllowed} for this event).
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
            persistMaxTickets(n);
          }}
        >
          {getTicketCountOptions(maxTicketsAllowed).map((count) => (
            <Option key={`max-tickets-option-${count}`} value={`${count}`}>
              {count}
            </Option>
          ))}
        </Select>
      </div>
      <BlackHighlightButton
        text="Delete Event"
        onClick={() => {
          handleDeleteEvent();
        }}
        className="w-32 mt-5"
      />
      <DeleteEventModal
        eventName={eventName}
        eventStartDate={eventStartDate}
        orderTicketsMap={orderTicketsMap}
        modalOpen={modalOpen}
        onClose={onClose}
        onConfirm={onConfirm}
        loading={deleteLoading}
      />
      {saving && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Spinner className="h-4 w-4" />
          <span>Saving...</span>
        </div>
      )}
    </div>
  );
};

export default EventDrilldownSettingsPage;
