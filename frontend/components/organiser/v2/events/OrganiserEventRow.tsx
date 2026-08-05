"use client";

import {
  EventHoverDescription,
  EventHoverFlags,
  EventHoverMetrics,
} from "@/components/organiser/v2/events/EventHoverBody";
import {
  EntityHoverCover,
  EntityHoverPreview,
} from "@/components/organiser/v2/shared/EntityHoverPreview";
import { EventData } from "@/interfaces/EventTypes";
import { timestampToEventCardDateString } from "@/services/src/datetimeUtils";
import { getEventPriceDisplay } from "@/utilities/priceUtils";
import { CalendarDaysIcon, MapPinIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import Skeleton from "react-loading-skeleton";

export function OrganiserEventFillBar({ filled, capacity }: { filled: number; capacity: number }) {
  const percent = capacity > 0 ? Math.min(100, Math.round((filled / capacity) * 100)) : 0;

  return (
    <div className="mt-2.5 flex items-center gap-2">
      <div
        className="h-1 flex-1 rounded-full bg-surface-muted overflow-hidden"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${percent}% filled`}
      >
        <div
          className="h-full rounded-full bg-foreground-secondary transition-[width] duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-foreground-muted font-sans shrink-0">
        {filled}/{capacity}
      </span>
    </div>
  );
}

type OrganiserEventRowProps = {
  event: EventData;
  className?: string;
};

export function OrganiserEventRow({ event, className = "" }: OrganiserEventRowProps) {
  const filled = Math.max(0, event.capacity - event.vacancy);
  const isSoldOut = event.capacity > 0 && filled >= event.capacity;
  const thumbnailSrc = event.thumbnail || event.image;

  return (
    <EntityHoverPreview
      cover={<EntityHoverCover src={event.image || event.thumbnail} />}
      title={event.name}
      metrics={<EventHoverMetrics event={event} />}
      body={<EventHoverDescription event={event} />}
      flags={<EventHoverFlags event={event} />}
    >
      <Link
        href={`/organiser/v2/event/${event.eventId}`}
        className={`group flex w-full items-center gap-3 p-2.5 sm:p-3 hover:bg-surface-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus ${className}`}
      >
        <div
          className="h-[4.25rem] w-[4.25rem] sm:h-[4.75rem] sm:w-[4.75rem] shrink-0 rounded-lg border border-border bg-surface-muted bg-cover bg-center"
          style={{ backgroundImage: thumbnailSrc ? `url(${thumbnailSrc})` : undefined }}
          role="img"
          aria-label=""
        />

        <div className="min-w-0 flex-1 py-0.5">
          <div className="flex items-start justify-between gap-3">
            <p className="min-w-0 text-sm font-semibold text-foreground font-sans truncate leading-snug">
              {event.name}
            </p>
            <div className="shrink-0 text-right">
              {isSoldOut ? (
                <span className="text-xs font-medium text-foreground-muted font-sans">Sold out</span>
              ) : (
                <span className="text-xs font-medium text-foreground-muted font-sans tabular-nums whitespace-nowrap">
                  {getEventPriceDisplay(event.price, true)}
                </span>
              )}
            </div>
          </div>

          <p className="text-xs text-foreground-muted font-sans truncate mt-1 flex items-center gap-1">
            <CalendarDaysIcon className="inline h-3.5 w-3.5 shrink-0" aria-hidden />
            {timestampToEventCardDateString(event.startDate)}
          </p>
          <p className="text-xs text-foreground-muted font-sans truncate mt-0.5 flex items-center gap-1">
            <MapPinIcon className="inline h-3.5 w-3.5 shrink-0" aria-hidden />
            {event.location}
          </p>
          <OrganiserEventFillBar filled={filled} capacity={event.capacity} />
        </div>
      </Link>
    </EntityHoverPreview>
  );
}

export function OrganiserEventRowSkeleton() {
  return (
    <div className="flex w-full items-center gap-3 p-2.5 sm:p-3">
      <Skeleton height={68} width={68} className="!rounded-lg shrink-0 sm:!h-[4.75rem] sm:!w-[4.75rem]" />
      <div className="min-w-0 flex-1 py-0.5 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <Skeleton height={14} width="62%" />
          <Skeleton height={14} width={56} />
        </div>
        <Skeleton height={12} width="55%" />
        <Skeleton height={12} width="65%" />
        <Skeleton height={4} />
      </div>
    </div>
  );
}
