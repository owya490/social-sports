"use client";

import { EventData } from "@/interfaces/EventTypes";
import { OrganiserEventRow, OrganiserEventRowSkeleton } from "./OrganiserEventRow";

type OrganiserEventListPanelProps = {
  events: EventData[];
  loading?: boolean;
  skeletonCount?: number;
  className?: string;
};

export function OrganiserEventListPanel({
  events,
  loading = false,
  skeletonCount = 6,
  className = "",
}: OrganiserEventListPanelProps) {
  return (
    <div className={`rounded-xl border border-border bg-background overflow-hidden ${className}`}>
      {loading ? (
        <div className="divide-y divide-border">
          {Array.from({ length: skeletonCount }, (_, index) => (
            <OrganiserEventRowSkeleton key={index} />
          ))}
        </div>
      ) : (
        <div className="divide-y divide-border">
          {events.map((event) => (
            <OrganiserEventRow key={event.eventId} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
