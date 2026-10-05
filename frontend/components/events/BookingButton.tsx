"use client";
import { EventId } from "@/interfaces/EventTypes";
import { EventTicketType } from "@/interfaces/EventTicketTypeTypes";
import { FulfilmentSessionType, PaymentProvider } from "@/interfaces/FulfilmentTypes";
import { PublicUserData } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import { isBookingMaintenanceActive } from "@/services/featureFlags";
import { getNextFulfilmentEntityUrl, initFulfilmentSession } from "@/services/src/fulfilment/fulfilmentServices";
import { getErrorUrl } from "@/services/src/urlUtils";
import { useRouter } from "next/navigation";
import { useState } from "react";
import BookingCheckoutDrawer, { offersPaymentChoice } from "./BookingCheckoutDrawer";

const logger = new Logger("BookingButtonLogger");

interface BookingButtonProps {
  eventId: EventId;
  ticketCount: number;
  setLoading?: (value: boolean) => void;
  className?: string;
  bookingApprovalEnabled?: boolean;
  eventTicketType?: EventTicketType | null;
  eventName?: string;
  organiser?: PublicUserData;
  eventDate?: string;
  supportedPaymentProviders?: PaymentProvider[] | null;
}

export default function BookingButton({
  eventId,
  ticketCount,
  setLoading,
  className = "",
  bookingApprovalEnabled = false,
  eventTicketType,
  eventName,
  organiser,
  eventDate,
  supportedPaymentProviders,
}: BookingButtonProps) {
  const router = useRouter();
  const [internalLoading, setInternalLoading] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const eventTicketTypeId = eventTicketType?.id ?? null;
  const checkoutUnavailable = eventTicketTypeId === null;
  const showPaymentChoice = offersPaymentChoice(eventTicketType?.price);

  const startCheckout = async (paymentProvider: PaymentProvider) => {
    if (eventTicketTypeId === null || internalLoading || isBookingMaintenanceActive()) {
      return;
    }

    setInternalLoading(true);
    setLoading?.(true);

    try {
      const { fulfilmentSessionId } = await initFulfilmentSession({
        type: FulfilmentSessionType.CHECKOUT,
        eventId: eventId,
        numTickets: ticketCount,
        eventTicketTypeId,
        paymentProvider,
      });

      if (!fulfilmentSessionId) {
        logger.error(`Failed to initialize fulfilment session for eventId: ${eventId}`);
        router.push(getErrorUrl(new Error("Failed to initialize fulfilment session for eventId")));
        return;
      }

      const nextEntityUrl = await getNextFulfilmentEntityUrl(fulfilmentSessionId);
      if (nextEntityUrl === undefined) {
        logger.error(`No url response received for fulfilmentSessionId: ${fulfilmentSessionId}`);
        router.push(getErrorUrl(new Error("No url response received for fulfilmentSessionId")));
        return;
      }

      router.push(nextEntityUrl);
    } catch (error) {
      logger.error(`Error booking event: ${error}`);
      router.push(getErrorUrl(error));
    }
  };

  const handleBookNow = () => {
    if (checkoutUnavailable || isBookingMaintenanceActive() || internalLoading) {
      return;
    }

    if (showPaymentChoice) {
      setCheckoutOpen(true);
      return;
    }

    void startCheckout(PaymentProvider.STRIPE);
  };

  const closeCheckout = () => {
    if (internalLoading) {
      return;
    }
    setCheckoutOpen(false);
  };

  const maintenanceActive = isBookingMaintenanceActive();
  const label = maintenanceActive ? "Booking Paused" : bookingApprovalEnabled ? "Request to Book" : "Book Now";

  return (
    <>
      <button
        type="button"
        className={`${className} disabled:opacity-50 disabled:pointer-events-none`}
        onClick={handleBookNow}
        disabled={internalLoading || maintenanceActive || checkoutUnavailable}
        aria-disabled={maintenanceActive || checkoutUnavailable}
      >
        {internalLoading && !showPaymentChoice ? "Booking..." : label}
      </button>
      {showPaymentChoice ? (
        <BookingCheckoutDrawer
          open={checkoutOpen}
          onClose={closeCheckout}
          eventName={eventName}
          organiser={organiser}
          eventDate={eventDate}
          eventTicketType={eventTicketType}
          quantity={ticketCount}
          supportedPaymentProviders={supportedPaymentProviders}
          bookingApprovalEnabled={bookingApprovalEnabled}
          onPay={(provider) => {
            void startCheckout(provider);
          }}
        />
      ) : null}
    </>
  );
}
