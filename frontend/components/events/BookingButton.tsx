"use client";
import { EventId } from "@/interfaces/EventTypes";
import { EventTicketTypeId } from "@/interfaces/EventTicketTypeTypes";
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
  eventTicketTypeId: EventTicketTypeId | null;
  setLoading?: (value: boolean) => void;
  className?: string;
  bookingApprovalEnabled?: boolean;
  unitPriceCents?: number;
  itemName?: string;
  eventName?: string;
  organiser?: PublicUserData;
  eventDate?: string;
}

export default function BookingButton({
  eventId,
  ticketCount,
  eventTicketTypeId,
  setLoading,
  className = "",
  bookingApprovalEnabled = false,
  unitPriceCents,
  itemName = "Ticket",
  eventName,
  organiser,
  eventDate,
}: BookingButtonProps) {
  const router = useRouter();
  const [internalLoading, setInternalLoading] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<PaymentProvider | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const checkoutUnavailable = eventTicketTypeId === null;
  const showPaymentChoice = offersPaymentChoice(unitPriceCents);

  const startCheckout = async (paymentProvider?: PaymentProvider) => {
    if (eventTicketTypeId === null || isBookingMaintenanceActive()) {
      return;
    }

    setPendingProvider(paymentProvider ?? null);
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

    void startCheckout();
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
      {showPaymentChoice && unitPriceCents !== undefined ? (
        <BookingCheckoutDrawer
          open={checkoutOpen}
          onClose={closeCheckout}
          eventName={eventName}
          organiser={organiser}
          eventDate={eventDate}
          itemName={itemName}
          quantity={ticketCount}
          unitPriceCents={unitPriceCents}
          pendingProvider={pendingProvider}
          onPay={(provider) => {
            void startCheckout(provider);
          }}
        />
      ) : null}
    </>
  );
}
