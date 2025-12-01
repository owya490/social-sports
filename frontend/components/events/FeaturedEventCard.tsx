// frontend/components/events/FeaturedEventCard.tsx
import { BasicEvent } from "@/interfaces/EventTypes";
import { timestampToEventCardDateString } from "@/services/src/datetimeUtils";
import { displayPrice } from "@/utilities/priceUtils";
import { MapPinIcon } from "@heroicons/react/24/outline";
import { Timestamp } from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";

interface FeaturedEventCardProps {
  event: BasicEvent;
}

export function FeaturedEventCard({ event }: FeaturedEventCardProps) {
  const eventTimestamp = Timestamp.fromDate(new Date(event.eventDate));

  return (
    <Link href={`/event/${event.eventId}`} passHref>
      <div className="bg-white text-left w-full hover:cursor-pointer hover:scale-[1.02] transition-all duration-300 overflow-hidden flex flex-col min-h-[300px]">
        <div
          className="w-full relative flex-shrink-0 bg-gray-100"
          style={{ aspectRatio: "1/1", borderRadius: "0.5rem 0.5rem 0 0" }}
        >
          <Image src={event.eventImage} alt={event.eventName} layout="fill" objectFit="cover" />
        </div>
        <div className="p-4 flex flex-col flex-grow">
          <div className="flex items-center mb-1">
            <h4 className="font-light text-gray-500 text-xs">{timestampToEventCardDateString(eventTimestamp)}</h4>
            <h4 className="font-light text-gray-500 text-xs ml-auto">{`A$${displayPrice(event.eventPrice)}`}</h4>
          </div>
          <h2 className="text-lg font-semibold mt-0.5 text-gray-900 truncate flex-grow">{event.eventName}</h2>
          <div className="mt-auto flex items-center ml-0.5">
            <MapPinIcon className="w-4 shrink-0 text-gray-400" />
            <p className="ml-1 font-light text-gray-700 text-xs whitespace-nowrap overflow-hidden truncate">
              {event.eventLocation}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
