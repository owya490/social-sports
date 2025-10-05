"use client";
import { HighlightButton } from "@/components/elements/HighlightButton";
import { EventData } from "@/interfaces/EventTypes";
import { timestampToEventCardDateString } from "@/services/src/datetimeUtils";
import { displayPrice } from "@/utilities/priceUtils";
import { MapPinIcon } from "@heroicons/react/24/outline";
import { Option, Select } from "@material-tailwind/react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const MAX_TICKETS_PER_ORDER = 7;

interface CalendarEventCardProps {
  event: EventData;
  ticketCount: number;
  loading: boolean;
  onTicketCountChange: (value: string | undefined) => void;
  onBookNow: () => void;
}

export default function CalendarEventCard({
  event,
  ticketCount,
  loading,
  onTicketCountChange,
  onBookNow,
}: CalendarEventCardProps) {
  const router = useRouter();

  return (
    <div className="p-4">
      {/* Title */}
      <h4
        className="font-bold text-lg mb-3 cursor-pointer hover:underline"
        onClick={() => router.push(`/event/${event.eventId}`)}
      >
        {event.name}
      </h4>

      {/* Image and Metadata in line */}
      <div className="flex gap-4 mb-4">
        {/* Event Thumbnail */}
        <div className="flex-shrink-0">
          <Image
            src={event.thumbnail || event.image}
            alt={event.name}
            width={100}
            height={100}
            className="object-cover w-24 h-24 rounded-lg"
          />
        </div>

        {/* Metadata */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center">
            <p className="font-light text-gray-500 text-xs">{timestampToEventCardDateString(event.startDate)}</p>
            <p className="font-light text-gray-500 text-xs ml-auto">{displayPrice(event.price)}</p>
          </div>

          <div className="flex items-center">
            <MapPinIcon className="w-4 shrink-0" />
            <p className="ml-1 font-light text-xs whitespace-nowrap overflow-hidden">{event.location}</p>
          </div>

          <p className="text-xs text-gray-500">
            {event.vacancy} {event.vacancy === 1 ? "spot" : "spots"} left
          </p>
        </div>
      </div>

      {/* Ticket Selection and Book Now */}
      <div className="flex items-center gap-3">
        <Select value={ticketCount.toString()} onChange={onTicketCountChange} label="Tickets" disabled={loading}>
          {Array.from({ length: Math.min(event.vacancy, MAX_TICKETS_PER_ORDER) }, (_, i) => i + 1).map((num) => (
            <Option key={num} value={num.toString()}>
              {num}
            </Option>
          ))}
        </Select>

        <HighlightButton
          onClick={onBookNow}
          className="flex-1"
          text={loading ? "Booking..." : "Book Now"}
          disabled={loading}
        />
      </div>
    </div>
  );
}
