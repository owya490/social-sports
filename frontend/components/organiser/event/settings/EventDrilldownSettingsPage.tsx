import { BlackHighlightButton } from "@/components/elements/HighlightButton";
import { useUser } from "@/components/utility/UserContext";
import { EventMetadata } from "@/interfaces/EventTypes";
import { Logger } from "@/observability/logger";
import { archiveAndDeleteEvent, updateEventById } from "@/services/src/events/eventsService";
import { bustEventsLocalStorageCache } from "@/services/src/events/eventsUtils/getEventsUtils";
import { sendEmailOnDeleteEventV2 } from "@/services/src/loops/loopsService";
import { WAITLIST_ENABLED } from "@/services/src/waitlist/waitlistService";
import { BOOKING_APPROVAL_ENABLED } from "@/services/featureFlags";
import { Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LabelledSwitch } from "../../../elements/LabelledSwitch";
import DeleteEventModal from "./DeleteEventModal";

interface EventDrilldownSettingsPageProps {
  eventId: string;
  eventMetadata: EventMetadata;
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
}

const EventDrilldownSettingsPage = ({
  eventId,
  eventMetadata,
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
}: EventDrilldownSettingsPageProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const { user, auth } = useUser();
  const logger = new Logger("EventDrilldownSettingsLogger");
  const [deleteLoading, setDeleteLoading] = useState(false);
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
      <LabelledSwitch
        title={"Hide Vacancy"}
        description={"Enable to hide the vacant ticket count from the event page."}
        state={hideVacancy}
        setState={setHideVacancy}
        updateData={(event: boolean) => {
          updateEventById(eventId, {
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
            updateEventById(eventId, {
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
            updateEventById(eventId, {
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
          updateEventById(eventId, {
            showAttendeesOnEventPage: event,
          });
        }}
      />
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
        eventMetadata={eventMetadata}
        eventId={eventId}
        modalOpen={modalOpen}
        onClose={onClose}
        onConfirm={onConfirm}
        loading={deleteLoading}
      />
    </div>
  );
};

export default EventDrilldownSettingsPage;
