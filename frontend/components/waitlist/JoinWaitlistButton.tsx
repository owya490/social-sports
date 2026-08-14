"use client";
import { EventId } from "@/interfaces/EventTypes";
import { EventTicketTypeId } from "@/interfaces/EventTicketTypeTypes";
import { FulfilmentSessionType } from "@/interfaces/FulfilmentTypes";
import { Logger } from "@/observability/logger";
import { getNextFulfilmentEntityUrl, initFulfilmentSession } from "@/services/src/fulfilment/fulfilmentServices";
import { getErrorUrl } from "@/services/src/urlUtils";
import { useRouter } from "next/navigation";
import { useState } from "react";

const logger = new Logger("JoinWaitlistButtonLogger");

interface JoinWaitlistButtonProps {
  eventId: EventId;
  ticketCount: number;
  eventTicketTypeId: EventTicketTypeId | null;
  setLoading?: (value: boolean) => void;
  className?: string;
}

export default function JoinWaitlistButton({
  eventId,
  ticketCount,
  eventTicketTypeId,
  setLoading,
  className = "",
}: JoinWaitlistButtonProps) {
  const router = useRouter();
  const [internalLoading, setInternalLoading] = useState(false);
  const checkoutUnavailable = eventTicketTypeId === null;

  const handleJoinWaitlist = async () => {
    if (checkoutUnavailable) {
      return;
    }

    setInternalLoading(true);
    setLoading?.(true);

    try {
      const { fulfilmentSessionId } = await initFulfilmentSession({
        type: FulfilmentSessionType.WAITLIST,
        eventId: eventId,
        numTickets: ticketCount,
        eventTicketTypeId,
      });

      if (!fulfilmentSessionId) {
        logger.error(`Failed to initialize waitlist fulfilment session for eventId: ${eventId}`);
        router.push(getErrorUrl(new Error("Failed to initialize waitlist fulfilment session")));
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
      logger.error(`Error joining waitlist: ${error}`);
      router.push(getErrorUrl(error));
    }
  };

  return (
    <button 
      type="button" 
      className={`${className} disabled:opacity-50 disabled:pointer-events-none`}
      onClick={handleJoinWaitlist} 
      disabled={internalLoading || checkoutUnavailable}
    >
      {internalLoading ? "Joining..." : "Join Waitlist"}
    </button>
  );
}
