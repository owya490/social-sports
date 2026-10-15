"use client";

import { EventHubInitials } from "@/components/organiser/v2/event-hub/EventHubStage";
import { EventHubPanel } from "@/components/organiser/v2/event-hub/EventHubPanel";
import { EventId, OrderId } from "@/interfaces/EventTypes";
import { useUser } from "@/components/utility/UserContext";
import { Logger } from "@/observability/logger";
import {
  BookingApprovalNotification,
  fetchBookingApprovalNotifications,
} from "@/services/src/organiser/bookingApprovalNotifications";
import { BellIcon, TicketIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import Skeleton from "react-loading-skeleton";

const logger = new Logger("organiserNotificationsLogger");

/** Temporary preview. Delete this constant, then use `items ?? []` for notifications again. */
const SAMPLE_NOTIFICATIONS: BookingApprovalNotification[] = [
  {
    orderId: "sample-alex" as OrderId,
    eventId: "sample-sunday" as EventId,
    eventName: "Sunday hit",
    purchaserName: "Alex Chen",
    purchasedAtSeconds: Math.floor(Date.now() / 1000) - 60 * 60 * 26,
  },
  {
    orderId: "sample-casey" as OrderId,
    eventId: "sample-friday" as EventId,
    eventName: "Friday social",
    purchaserName: "Casey Nguyen",
    purchasedAtSeconds: Math.floor(Date.now() / 1000) - 60 * 40,
  },
  {
    orderId: "sample-jordan" as OrderId,
    eventId: "sample-friday" as EventId,
    eventName: "Friday social",
    purchaserName: "Jordan Blake",
    purchasedAtSeconds: Math.floor(Date.now() / 1000) - 60 * 8,
  },
];

type OrganiserNotificationsContextValue = {
  openNotifications: () => void;
  count: number;
};

const OrganiserNotificationsContext = createContext<OrganiserNotificationsContextValue | null>(null);

function formatPurchasedDate(seconds: number): string {
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(seconds * 1000));
}

export function OrganiserNotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<BookingApprovalNotification[] | null>(null);

  useEffect(() => {
    if (user.userId === "") {
      return;
    }

    let active = true;
    fetchBookingApprovalNotifications(user.userId)
      .then((notifications) => {
        if (active) setItems(notifications);
      })
      .catch((error) => {
        logger.error("fetchBookingApprovalNotifications() " + error);
        if (active) setItems([]);
      });

    return () => {
      active = false;
    };
  }, [user.userId]);

  const loading = SAMPLE_NOTIFICATIONS.length === 0 && user.userId !== "" && items === null;
  const notifications = SAMPLE_NOTIFICATIONS.length > 0 ? SAMPLE_NOTIFICATIONS : (items ?? []);

  return (
    <OrganiserNotificationsContext.Provider
      value={{ openNotifications: () => setOpen(true), count: notifications.length }}
    >
      {children}
      <EventHubPanel open={open} onClose={() => setOpen(false)} title="Notifications">
        {loading ? (
          <Skeleton height={44} className="rounded-lg" />
        ) : notifications.length === 0 ? (
          <div>
            <p className="font-sans text-sm font-medium text-foreground">No notifications</p>
            <p className="mt-0.5 font-sans text-sm text-foreground-muted">All quiet on the pitch.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-1">
            {notifications.map((item) => (
              <li key={item.orderId}>
                <Link
                  href={`/organiser/v2/event/${item.eventId}`}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  <EventHubInitials name={item.purchaserName} />
                  <div className="min-w-0 flex-1">
                    <p className="font-sans text-sm leading-snug">
                      <span className="font-semibold text-foreground">{item.purchaserName}</span>
                      <span className="text-foreground-muted"> is waiting for approval</span>
                    </p>
                    <p className="mt-0.5 flex min-w-0 items-center gap-1 font-sans text-sm text-foreground-secondary">
                      <TicketIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span className="truncate">{item.eventName}</span>
                    </p>
                    <time
                      dateTime={new Date(item.purchasedAtSeconds * 1000).toISOString()}
                      className="mt-0.5 block font-sans text-xs text-foreground-muted"
                    >
                      {formatPurchasedDate(item.purchasedAtSeconds)}
                    </time>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </EventHubPanel>
    </OrganiserNotificationsContext.Provider>
  );
}

export function OrganiserNotificationBell() {
  const notifications = useContext(OrganiserNotificationsContext);
  if (!notifications) {
    return null;
  }

  const { openNotifications, count } = notifications;

  return (
    <button
      type="button"
      onClick={openNotifications}
      className="relative ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      aria-label={count > 0 ? `Notifications, ${count} waiting` : "Notifications"}
    >
      <BellIcon className="h-5 w-5 stroke-[1.5]" aria-hidden />
      {count > 0 ? (
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" aria-hidden />
      ) : null}
    </button>
  );
}
