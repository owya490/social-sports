"use client";

import { PendingBookingApproval } from "@/services/src/organiser/organiserDashboardMetricsService";
import Link from "next/link";

export function pendingBookingLabel(count: number): string {
  return count === 1 ? "1 booking to approve" : `${count} bookings to approve`;
}

export function PendingBookingApprovalRows({ approvals }: { approvals: PendingBookingApproval[] }) {
  return (
    <ul className="divide-y divide-border">
      {approvals.map((item) => (
        <li key={item.eventId}>
          <Link
            href={`/organiser/v2/event/${item.eventId}`}
            className="flex min-w-0 items-center justify-between gap-3 rounded-lg py-2.5 hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <span className="min-w-0 truncate font-sans text-sm font-medium text-foreground">
              {item.eventName}
            </span>
            <span className="shrink-0 font-sans text-xs text-foreground-muted">
              {pendingBookingLabel(item.pendingOrderCount)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

type PendingBookingApprovalsNoticeProps = {
  approvals: PendingBookingApproval[];
};

/** Compact dashboard note. Hidden when nothing is waiting. */
export function PendingBookingApprovalsNotice({ approvals }: PendingBookingApprovalsNoticeProps) {
  if (approvals.length === 0) {
    return null;
  }

  return (
    <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto" aria-label="Bookings needing approval">
      <div className="rounded-xl border border-border bg-background px-4 py-3 sm:px-5">
        <h2 className="font-sans text-sm font-semibold text-foreground">Needs approval</h2>
        <p className="mt-0.5 font-sans text-xs text-foreground-muted">
          These events have bookings waiting for you to accept.
        </p>
        <div className="mt-1">
          <PendingBookingApprovalRows approvals={approvals} />
        </div>
      </div>
    </section>
  );
}
