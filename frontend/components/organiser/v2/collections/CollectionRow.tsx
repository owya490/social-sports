"use client";

import { EventCollection } from "@/interfaces/EventCollectionTypes";
import { LockClosedIcon, LockOpenIcon, RectangleStackIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import Skeleton from "react-loading-skeleton";

type CollectionRowProps = {
  collection: EventCollection;
};

export function CollectionRow({ collection }: CollectionRowProps) {
  const eventCount = collection.eventIds.length;
  const templateCount = collection.recurringEventTemplateIds.length;
  const totalItems = eventCount + templateCount;
  const href = `/organiser/event/event-collection/${collection.eventCollectionId}`;

  return (
    <Link
      href={href}
      className="group flex w-full items-center gap-3 p-2.5 sm:p-3 hover:bg-surface-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus"
    >
      <div
        className="h-[4.25rem] w-[4.25rem] sm:h-[4.75rem] sm:w-[4.75rem] shrink-0 rounded-lg border border-border bg-surface-muted bg-cover bg-center"
        style={{ backgroundImage: collection.image ? `url(${collection.image})` : undefined }}
        role="img"
        aria-label=""
      />

      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 text-sm font-semibold text-foreground font-sans truncate leading-snug">
            {collection.name}
          </p>
          <span className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-foreground-muted font-sans">
            {collection.isPrivate ? (
              <LockClosedIcon className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <LockOpenIcon className="h-3.5 w-3.5" aria-hidden />
            )}
            {collection.isPrivate ? "Private" : "Public"}
          </span>
        </div>

        {collection.description ? (
          <p className="text-xs text-foreground-muted font-sans line-clamp-2 mt-1">{collection.description}</p>
        ) : null}

        <p className="text-xs text-foreground-muted font-sans truncate mt-1.5 flex items-center gap-1">
          <RectangleStackIcon className="inline h-3.5 w-3.5 shrink-0" aria-hidden />
          {totalItems === 0
            ? "No events yet"
            : `${totalItems} item${totalItems === 1 ? "" : "s"}${
                templateCount > 0 ? ` · ${templateCount} recurring` : ""
              }`}
        </p>
      </div>
    </Link>
  );
}

export function CollectionRowSkeleton() {
  return (
    <div className="flex w-full items-center gap-3 p-2.5 sm:p-3">
      <Skeleton height={68} width={68} className="!rounded-lg shrink-0 sm:!h-[4.75rem] sm:!w-[4.75rem]" />
      <div className="min-w-0 flex-1 py-0.5 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <Skeleton height={14} width="58%" />
          <Skeleton height={14} width={52} />
        </div>
        <Skeleton height={12} width="80%" />
        <Skeleton height={12} width="40%" />
      </div>
    </div>
  );
}
