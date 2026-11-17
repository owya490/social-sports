"use client";

import Image from "@/components/elements/AppImage";
import { EventData } from "@/interfaces/EventTypes";
import { FeaturedEventReference } from "@/interfaces/UserTypes";
import { timestampToEventCardDateString } from "@/services/src/datetimeUtils";
import { MapPinIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

type FeaturedEventProps = {
  reference: FeaturedEventReference;
  event: EventData | null;
};

export function FeaturedEvent({ reference, event }: FeaturedEventProps) {
  const name = event?.name?.trim() || reference.name?.trim() || "Featured event";
  const href = `/event/${event?.eventId || reference.eventId}`;
  const imageSrc = event ? event.thumbnail || event.image : "";

  return (
    <section aria-label="Featured event" className="mb-6 sm:mb-8">
      <p className="text-xs font-semibold text-foreground-muted font-sans">Featured</p>
      <Link
        href={href}
        className="mt-3 flex max-w-2xl items-center gap-4 rounded-xl border border-border bg-background p-4 transition-colors hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        {imageSrc ? (
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface-muted">
            <Image src={imageSrc} alt="" fill className="object-cover" sizes="80px" />
          </div>
        ) : null}
        <div className="min-w-0">
          <p className="text-base font-semibold text-foreground font-sans tracking-tight">{name}</p>
          {event ? (
            <>
              <p className="mt-1 text-xs text-foreground-muted font-sans">
                {timestampToEventCardDateString(event.startDate)}
              </p>
              {event.location ? (
                <p className="mt-1 flex items-start gap-1.5 text-xs text-foreground-secondary font-sans">
                  <MapPinIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="line-clamp-1">{event.location}</span>
                </p>
              ) : null}
            </>
          ) : null}
        </div>
      </Link>
    </section>
  );
}
