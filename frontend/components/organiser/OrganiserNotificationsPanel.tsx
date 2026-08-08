"use client";

import { EventHubPanel } from "@/components/organiser/v2/event-hub/EventHubPanel";

const COMING_SOON_ITEMS = [
  {
    date: "Soon",
    title: "Event updates",
    description: "Booking activity, capacity changes, and event reminders in one place.",
  },
  {
    date: "Soon",
    title: "Attendee activity",
    description: "See when people join, cancel, or need your approval.",
  },
  {
    date: "Soon",
    title: "Organiser alerts",
    description: "Payments, Stripe status, and important account notices.",
  },
] as const;

type OrganiserNotificationsPanelProps = {
  open: boolean;
  onClose: () => void;
};

export function OrganiserNotificationsPanel({ open, onClose }: OrganiserNotificationsPanelProps) {
  return (
    <EventHubPanel open={open} onClose={onClose} title="Notifications">
      <div className="space-y-5">
        <p className="font-sans text-sm text-foreground-muted">
          Coming soon — your organiser notification timeline will live here.
        </p>

        <ol className="ms-3 flex flex-col border-l border-border">
          {COMING_SOON_ITEMS.map((item) => (
            <li key={item.title} className="relative pb-6 pl-6 last:pb-0">
              <span
                aria-hidden
                className="absolute top-1 -left-1.5 h-3 w-3 rounded-full border-2 border-border bg-background"
              />
              <time className="mb-1 block font-sans text-xs font-medium text-foreground-muted">
                {item.date}
              </time>
              <p className="font-sans text-sm font-medium text-foreground">{item.title}</p>
              <p className="mt-0.5 font-sans text-sm text-foreground-muted">{item.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </EventHubPanel>
  );
}
