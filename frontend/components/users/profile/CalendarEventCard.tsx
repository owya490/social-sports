"use client";
import BookingButton from "@/components/events/BookingButton";
import ContactEventButton from "@/components/events/ContactEventButton";
import { MAX_TICKETS_PER_ORDER } from "@/components/events/EventDetails";
import { EventData } from "@/interfaces/EventTypes";
import { timestampToEventCardDateString } from "@/services/src/datetimeUtils";
import { displayPrice } from "@/utilities/priceUtils";
import { MapPinIcon } from "@heroicons/react/24/outline";
import { Option, Select } from "@material-tailwind/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface CalendarEventCardProps {
  event: EventData;
}

export default function CalendarEventCard({ event }: CalendarEventCardProps) {
  const router = useRouter();
  const [ticketCount, setTicketCount] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleTicketCountChange = (value: string | undefined) => {
    if (value) {
      setTicketCount(parseInt(value));
    }
  };

  const renderTicketBooking = () => (
    <div className="flex gap-3 items-center">
      <div className="flex-shrink-0 md:min-w-64">
        <Select value={ticketCount.toString()} onChange={handleTicketCountChange} label="Tickets" disabled={loading}>
          {Array.from({ length: Math.min(event.vacancy, MAX_TICKETS_PER_ORDER) }, (_, i) => i + 1).map((num) => (
            <Option key={num} value={num.toString()}>
              {num}
            </Option>
          ))}
        </Select>
      </div>

      <BookingButton
        eventId={event.eventId}
        ticketCount={ticketCount}
        setLoading={setLoading}
        className="flex-1 font-semibold rounded-xl border bg-black text-white hover:bg-white hover:text-black hover:border-core-outline py-2 transition-all duration-300"
      />
    </div>
  );

  return (
    <div className="p-4">
      {/* Mobile Layout (below md) */}
      <div className="md:hidden">
        {/* Title */}
        <h4
          className="font-bold text-lg mb-3 cursor-pointer hover:underline overflow-x-hidden"
          onClick={() => router.push(`/event/${event.eventId}`)}
        >
          {event.name}
        </h4>

        {/* Image and Metadata in line */}
        <div className="flex gap-4">
          {/* Event Thumbnail */}
          <div className="flex-shrink-0">
            <Image
              src={event.thumbnail || event.image}
              alt={event.name}
              width={0}
              height={0}
              className="object-cover w-24 h-24 aspect-square rounded-lg"
            />
          </div>

          {/* Metadata */}
          <div className="flex-1 space-y-2 overflow-x-hidden">
            <div className="flex items-center">
              <p className="font-light text-gray-500 text-xs">{timestampToEventCardDateString(event.startDate)}</p>
              <p className="font-light text-gray-500 text-xs ml-auto">${displayPrice(event.price)}</p>
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
        {event.paymentsActive ? (
          event.vacancy === 0 ? (
            <div className="mt-4">
              <p className="text-xs text-gray-500">Event currently sold out. Please check back later.</p>
            </div>
          ) : (
            <div className="mt-4">{renderTicketBooking()}</div>
          )
        ) : (
          <div className="flex justify-end">
            <ContactEventButton
              eventLink={event.eventLink}
              fallbackLink={`/event/${event.eventId}`}
              className="border border-black"
            />
          </div>
        )}
      </div>

      {/* Desktop Layout (above md) - Image spans all rows on left */}
      <div className="hidden md:flex gap-4">
        {/* Event Thumbnail - spans full height */}
        <div className="flex-shrink-0">
          <Image
            src={event.thumbnail || event.image}
            alt={event.name}
            width={0}
            height={0}
            className="object-cover w-40 h-full aspect-square rounded-lg"
          />
        </div>

        {/* Right side - 3 rows */}
        <div className="flex-1 flex flex-col gap-3">
          <div>
            <div className="flex items-center">
              <p className="font-light text-gray-500 text-xs">{timestampToEventCardDateString(event.startDate)}</p>
              <p className="font-light text-gray-500 text-xs ml-auto">${displayPrice(event.price)}</p>
            </div>
            {/* Row 1: Title */}
            <Link
              href={`/event/${event.eventId}`}
              className="font-bold text-lg hover:underline overflow-x-hidden focus:outline-none focus-visible:underline"
            >
              {event.name}
            </Link>
          </div>

          {/* Row 2: Metadata */}
          <div className="space-y-2 overflow-x-hidden mb-3">
            <div className="flex items-center">
              <MapPinIcon className="w-4 shrink-0" />
              <p className="ml-1 font-light text-xs whitespace-nowrap overflow-hidden">{event.location}</p>
            </div>

            <p className="text-xs text-gray-500">
              {event.vacancy} {event.vacancy === 1 ? "spot" : "spots"} left
            </p>
          </div>

          {/* Row 3: Ticket Selection and Book Now */}
          {event.paymentsActive ? (
            event.vacancy === 0 ? (
              <div className="mt-4">
                <p className="text-xs text-gray-500">Event currently sold out. Please check back later.</p>
              </div>
            ) : (
              <div className="mt-4">{renderTicketBooking()}</div>
            )
          ) : (
            <div className="flex justify-end">
              <ContactEventButton
                eventLink={event.eventLink}
                fallbackLink={`/event/${event.eventId}`}
                className="border border-black"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
