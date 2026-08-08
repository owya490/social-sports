"use client";

import BookingButton from "@/components/events/BookingButton";
import ContactEventButton from "@/components/events/ContactEventButton";
import { EventData } from "@/interfaces/EventTypes";
import { timestampToTimeOfDay } from "@/services/src/datetimeUtils";
import { resolveCheckoutTicketTypeId } from "@/services/src/events/eventsUtils/eventTicketTypesUtils";
import { getBuyerTicketCountOptions } from "@/services/src/events/eventsUtils/ticketLimits";
import { getEventPriceDisplay } from "@/utilities/priceUtils";
import { MapPinIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface CalendarEventCardProps {
  event: EventData;
}

export default function CalendarEventCard({ event }: CalendarEventCardProps) {
  const [ticketCount, setTicketCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const ticketOptions = getBuyerTicketCountOptions(event.vacancy, event.maxTicketsPerTransaction);
  const priceLabel = getEventPriceDisplay(event.price);
  const timeLabel = timestampToTimeOfDay(event.startDate);

  return (
    <article className="rounded-xl border border-border bg-background overflow-hidden">
      <div className="flex gap-4 p-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-baseline gap-3">
            <p className="text-xs font-medium text-foreground-muted font-sans shrink-0">{timeLabel}</p>
            <p className="text-xs font-medium text-foreground-secondary font-sans ml-auto shrink-0">{priceLabel}</p>
          </div>

          <Link
            href={`/event/${event.eventId}`}
            className="block text-base font-semibold text-foreground font-sans tracking-tight hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus rounded-sm"
          >
            {event.name}
          </Link>

          <div className="flex items-start gap-1.5 text-foreground-secondary">
            <MapPinIcon className="h-3.5 w-3.5 mt-0.5 shrink-0" aria-hidden />
            <p className="text-xs font-sans line-clamp-1">{event.location}</p>
          </div>

          <p className="text-xs text-foreground-muted font-sans">
            {event.vacancy === 0
              ? "Sold out"
              : `${event.vacancy} ${event.vacancy === 1 ? "spot" : "spots"} left`}
          </p>
        </div>

        <Link
          href={`/event/${event.eventId}`}
          className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-xl bg-surface-muted"
          aria-label={`View ${event.name}`}
        >
          <Image
            src={event.thumbnail || event.image}
            alt=""
            fill
            className="object-cover"
            sizes="96px"
          />
        </Link>
      </div>

      <div className="border-t border-border px-4 py-3">
        {event.paymentsActive ? (
          event.vacancy === 0 ? (
            <p className="text-xs text-foreground-muted font-sans">Sold out — check back later.</p>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <label className="sr-only" htmlFor={`tickets-${event.eventId}`}>
                Number of tickets
              </label>
              <select
                id={`tickets-${event.eventId}`}
                value={ticketCount}
                disabled={loading}
                onChange={(e) => setTicketCount(parseInt(e.target.value, 10))}
                className="w-full sm:w-28 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground font-sans focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                {ticketOptions.map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? "ticket" : "tickets"}
                  </option>
                ))}
              </select>
              <BookingButton
                eventId={event.eventId}
                ticketCount={ticketCount}
                eventTicketTypeId={resolveCheckoutTicketTypeId(event)}
                setLoading={setLoading}
                className="flex-1 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-contrast font-sans hover:brightness-95 transition-[filter] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60"
              />
            </div>
          )
        ) : (
          <div className="flex justify-end">
            <ContactEventButton
              eventLink={event.eventLink}
              fallbackLink={`/event/${event.eventId}`}
              className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground font-sans hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            />
          </div>
        )}
      </div>
    </article>
  );
}
