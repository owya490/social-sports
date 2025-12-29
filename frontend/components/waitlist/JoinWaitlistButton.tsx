"use client";
import { EventId } from "@/interfaces/EventTypes";
import { Logger } from "@/observability/logger";
import { getNextFulfilmentEntityUrl, initFulfilmentSession } from "@/services/src/fulfilment/fulfilmentServices";
import { getErrorUrl } from "@/services/src/urlUtils";
import { useRouter } from "next/navigation";
import { useState } from "react";

const logger = new Logger("JoinWaitlistButtonLogger");

interface JoinWaitlistButtonProps {
  eventId: EventId;
  ticketCount: number;
  setLoading?: (value: boolean) => void;
  className?: string;
}

export default function JoinWaitlistButton({ 
  eventId, 
  ticketCount, 
  setLoading, 
  className = "" 
}: JoinWaitlistButtonProps) {
  const router = useRouter();
  const [internalLoading, setInternalLoading] = useState(false);

  const handleJoinWaitlist = async () => {
    setInternalLoading(true);
    setLoading?.(true);

    try {
      const { fulfilmentSessionId } = await initFulfilmentSession({
        type: "waitlist",
        eventId: eventId,
        numTickets: ticketCount,
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
      className={className} 
      onClick={handleJoinWaitlist} 
      disabled={internalLoading}
    >
      {internalLoading ? "Joining..." : "Join Waitlist"}
    </button>
  );
}
