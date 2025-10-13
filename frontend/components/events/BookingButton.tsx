"use client";
import { EventId } from "@/interfaces/EventTypes";
import { Logger } from "@/observability/logger";
import { getNextFulfilmentEntityUrl, initFulfilmentSession } from "@/services/src/fulfilment/fulfilmentServices";
import { getErrorUrl } from "@/services/src/urlUtils";
import { useRouter } from "next/navigation";
import { useState } from "react";

const logger = new Logger("BookingButtonLogger");

interface BookingButtonProps {
  eventId: EventId;
  ticketCount: number;
  setLoading?: (value: boolean) => void;
  className?: string;
}

export default function BookingButton({ eventId, ticketCount, setLoading, className = "" }: BookingButtonProps) {
  const router = useRouter();
  const [internalLoading, setInternalLoading] = useState(false);

  const handleBookNow = async () => {
    setInternalLoading(true);
    setLoading?.(true);

    try {
      const { fulfilmentSessionId } = await initFulfilmentSession({
        type: "checkout",
        eventId: eventId,
        numTickets: ticketCount,
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

  return (
    <button type="button" className={className} onClick={handleBookNow} disabled={internalLoading}>
      {internalLoading ? "Booking..." : "Book Now"}
    </button>
  );
}
