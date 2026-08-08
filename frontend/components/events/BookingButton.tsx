"use client";
import { EventId } from "@/interfaces/EventTypes";
import { EventTicketTypeId } from "@/interfaces/EventTicketTypeTypes";
import { FulfilmentSessionType } from "@/interfaces/FulfilmentTypes";
import { Logger } from "@/observability/logger";
import { isBookingMaintenanceActive } from "@/services/featureFlags";
import { getNextFulfilmentEntityUrl, initFulfilmentSession } from "@/services/src/fulfilment/fulfilmentServices";
import { getErrorUrl } from "@/services/src/urlUtils";
import { useRouter } from "next/navigation";
import { useState } from "react";

const logger = new Logger("BookingButtonLogger");

interface BookingButtonProps {
  eventId: EventId;
  ticketCount: number;
  eventTicketTypeId: EventTicketTypeId;
  setLoading?: (value: boolean) => void;
  className?: string;
  bookingApprovalEnabled?: boolean;
}

export default function BookingButton({
  eventId,
  ticketCount,
  eventTicketTypeId,
  setLoading,
  className = "",
  bookingApprovalEnabled = false,
}: BookingButtonProps) {
  const router = useRouter();
  const [internalLoading, setInternalLoading] = useState(false);

  const handleBookNow = async () => {
    if (isBookingMaintenanceActive()) {
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

  const maintenanceActive = isBookingMaintenanceActive();
  const label = maintenanceActive ? "Booking Paused" : bookingApprovalEnabled ? "Request to Book" : "Book Now";

  return (
    <button
      type="button"
      className={className}
      onClick={handleBookNow}
      disabled={internalLoading || maintenanceActive}
      aria-disabled={maintenanceActive}
    >
      {internalLoading ? "Booking..." : label}
    </button>
  );
}
