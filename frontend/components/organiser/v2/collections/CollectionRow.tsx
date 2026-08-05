"use client";

import {
  EntityHoverCover,
  EntityHoverPreview,
  HoverList,
} from "@/components/organiser/v2/shared/EntityHoverPreview";
import { EventCollection } from "@/interfaces/EventCollectionTypes";
import { EventData, EventId } from "@/interfaces/EventTypes";
import { RecurrenceTemplate, RecurrenceTemplateId } from "@/interfaces/RecurringEventTypes";
import { getEventById } from "@/services/src/events/eventsService";
import { getRecurrenceTemplate } from "@/services/src/recurringEvents/recurringEventsService";
import { LockClosedIcon, LockOpenIcon, RectangleStackIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";

type CollectionPreviewItem = {
  id: string;
  name: string;
  kind: "event" | "series";
};

type CollectionRowProps = {
  collection: EventCollection;
};

async function loadPreviewItems(collection: EventCollection): Promise<CollectionPreviewItem[]> {
  const items: CollectionPreviewItem[] = [];
  const eventIds = collection.eventIds.slice(0, 2);

  const eventResults = await Promise.allSettled(
    eventIds.map((eventId) => getEventById(eventId as EventId)),
  );
  for (const result of eventResults) {
    if (result.status === "fulfilled") {
      const event = result.value as EventData;
      items.push({ id: event.eventId, name: event.name || "Untitled event", kind: "event" });
    }
  }

  if (items.length < 2) {
    const needed = 2 - items.length;
    const templateIds = collection.recurringEventTemplateIds.slice(0, needed);
    const templateResults = await Promise.allSettled(
      templateIds.map((id) => getRecurrenceTemplate(id as RecurrenceTemplateId)),
    );
    for (const result of templateResults) {
      if (result.status === "fulfilled") {
        const template = result.value as RecurrenceTemplate;
        items.push({
          id: template.recurrenceTemplateId,
          name: template.eventData.name || "Untitled series",
          kind: "series",
        });
      }
    }
  }

  return items.slice(0, 2);
}

export function CollectionRow({ collection }: CollectionRowProps) {
  const eventCount = collection.eventIds.length;
  const templateCount = collection.recurringEventTemplateIds.length;
  const totalItems = eventCount + templateCount;
  const href = `/organiser/event/event-collection/${collection.eventCollectionId}`;
  const itemsLabel =
    totalItems === 0
      ? "No events yet"
      : `${totalItems} item${totalItems === 1 ? "" : "s"}${
          templateCount > 0 ? ` · ${templateCount} recurring` : ""
        }`;

  const [previewItems, setPreviewItems] = useState<CollectionPreviewItem[]>([]);

  const eventIdsKey = collection.eventIds.join(",");
  const templateIdsKey = collection.recurringEventTemplateIds.join(",");

  useEffect(() => {
    let cancelled = false;
    if (totalItems === 0) {
      setPreviewItems([]);
      return;
    }
    void loadPreviewItems(collection).then((items) => {
      if (!cancelled) setPreviewItems(items);
    });
    return () => {
      cancelled = true;
    };
    // Refresh when membership changes; `collection` identity alone can churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection.eventCollectionId, eventIdsKey, templateIdsKey, totalItems]);

  const remaining = Math.max(0, totalItems - previewItems.length);

  return (
    <EntityHoverPreview
      cover={<EntityHoverCover src={collection.image} />}
      title={collection.name}
      body={
        <HoverList label="In this collection">
          {totalItems === 0 ? (
            <p className="text-foreground-secondary">No events yet.</p>
          ) : previewItems.length === 0 ? (
            <p className="text-foreground-secondary">Loading…</p>
          ) : (
            <>
              {previewItems.map((item) => (
                <div key={item.id} className="flex items-baseline gap-3">
                  <p className="min-w-0 flex-1 truncate text-foreground font-medium">{item.name}</p>
                  <span className="shrink-0 text-foreground-muted">
                    {item.kind === "series" ? "Series" : "Event"}
                  </span>
                </div>
              ))}
              {remaining > 0 ? (
                <p className="text-foreground-muted">
                  +{remaining} more item{remaining === 1 ? "" : "s"}
                </p>
              ) : null}
            </>
          )}
        </HoverList>
      }
      flags={collection.isPrivate ? "Invite only · not on public discovery" : null}
    >
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
            {itemsLabel}
          </p>
        </div>
      </Link>
    </EntityHoverPreview>
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
