"use client";

import { PendingBookingApprovalRows } from "@/components/organiser/PendingBookingApprovals";
import { EventHubPanel } from "@/components/organiser/v2/event-hub/EventHubPanel";
import { useUser } from "@/components/utility/UserContext";
import { Logger } from "@/observability/logger";
import {
  fetchOrganiserDashboardMetrics,
  PendingBookingApproval,
  tryGetCachedOrganiserDashboardMetrics,
} from "@/services/src/organiser/organiserDashboardMetricsService";
import { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";

const logger = new Logger("organiserNotificationsLogger");

const COMING_SOON_ITEMS = [
  {
    date: "Soon",
    title: "Event updates",
    description: "Booking activity, capacity changes, and event reminders in one place.",
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
  const { user } = useUser();
  const cachedMetrics =
    open && user.userId !== "" ? tryGetCachedOrganiserDashboardMetrics(user.userId) : null;
  const [loaded, setLoaded] = useState<{ userId: string; approvals: PendingBookingApproval[] } | null>(
    null
  );

  useEffect(() => {
    if (!open || user.userId === "" || cachedMetrics) {
      return;
    }

    let active = true;
    const userId = user.userId;
    fetchOrganiserDashboardMetrics(userId)
      .then((metrics) => {
        if (active) setLoaded({ userId, approvals: metrics.pendingApprovals });
      })
      .catch((error) => {
        logger.error("fetchOrganiserDashboardMetrics() notifications Error: " + error);
        if (active) setLoaded({ userId, approvals: [] });
      });

    return () => {
      active = false;
    };
  }, [open, user.userId, cachedMetrics]);

  const approvals =
    cachedMetrics?.pendingApprovals ??
    (loaded?.userId === user.userId ? loaded.approvals : null);
  const loading = open && user.userId !== "" && approvals === null;
  const visibleApprovals = approvals ?? [];

  return (
    <EventHubPanel open={open} onClose={onClose} title="Notifications">
      <div className="space-y-5">
        <section aria-label="Bookings needing approval">
          <h3 className="font-sans text-sm font-semibold text-foreground">Needs approval</h3>
          <p className="mt-0.5 font-sans text-sm text-foreground-muted">
            Events with bookings waiting for you to accept.
          </p>
          {loading ? (
            <div className="mt-3">
              <Skeleton height={40} className="rounded-lg" />
            </div>
          ) : visibleApprovals.length === 0 ? (
            <p className="mt-3 font-sans text-sm text-foreground-muted">No bookings waiting for approval.</p>
          ) : (
            <div className="mt-1">
              <PendingBookingApprovalRows approvals={visibleApprovals} />
            </div>
          )}
        </section>

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
