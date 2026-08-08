"use client";

import { ActivityFeedSection } from "@/components/organiser/v2/dashboard/ActivityFeedSection";
import { DashboardHeader } from "@/components/organiser/v2/dashboard/DashboardHeader";
import { DashboardKpiGrid } from "@/components/organiser/v2/dashboard/DashboardKpiGrid";
import { DashboardSetupSection } from "@/components/organiser/v2/dashboard/DashboardSetupSection";
import { UpcomingEventsSection } from "@/components/organiser/v2/dashboard/UpcomingEventsSection";
import { TicketSalesChart } from "@/components/organiser/v2/dashboard/TicketSalesChart";
import { TopSalesDonutSection } from "@/components/organiser/v2/dashboard/TopSalesDonutSection";
import { splitEventsByTime } from "@/components/organiser/v2/dashboard/computeDashboardStats";
import { useUser } from "@/components/utility/UserContext";
import { Logger } from "@/observability/logger";
import {
  fetchOrganiserDashboardMetrics,
  OrganiserDashboardMetrics,
} from "@/services/src/organiser/organiserDashboardMetricsService";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const logger = new Logger("organiserDashboardV2Logger");

const emptyMetrics: OrganiserDashboardMetrics = {
  netSales30dCents: 0,
  ticketsSold30d: 0,
  totalPageViews: 0,
  conversionRate: 0,
  weekTickets: [],
  monthTickets: [],
  salesByEvent30d: [],
  recentActivity: [],
  events: [],
};

/** Shared dashboard body — used by the real dashboard and the transient welcome route. */
export function OrganiserDashboardView() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [metrics, setMetrics] = useState<OrganiserDashboardMetrics | null>(null);

  useEffect(() => {
    const loadMetrics = async () => {
      if (user.userId === "") {
        return;
      }
      setError(false);
      try {
        const data = await fetchOrganiserDashboardMetrics(user.userId);
        setMetrics(data);
      } catch (loadError) {
        logger.error("fetchOrganiserDashboardMetrics() Error: " + loadError);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    loadMetrics();
  }, [user]);

  const upcoming = useMemo(() => {
    if (!metrics) return [];
    return splitEventsByTime(metrics.events).upcoming;
  }, [metrics]);

  const displayMetrics = metrics ?? emptyMetrics;

  return (
    <div className="min-h-screen bg-surface text-foreground pb-2">
      <DashboardHeader firstName={user.firstName} loading={loading && !metrics} />

      {error ? (
        <div className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mt-6">
          <div className="rounded-xl border border-border bg-background p-6 text-center">
            <p className="text-sm font-semibold text-foreground font-sans">Could not load dashboard metrics</p>
            <p className="mt-1 text-xs text-foreground-muted font-sans">
              Check your connection and try again.
            </p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setError(false);
                fetchOrganiserDashboardMetrics(user.userId)
                  .then(setMetrics)
                  .catch((loadError) => {
                    logger.error("fetchOrganiserDashboardMetrics() retry Error: " + loadError);
                    setError(true);
                  })
                  .finally(() => setLoading(false));
              }}
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-contrast font-sans hover:brightness-95 transition-[filter]"
            >
              Retry
            </button>
            <p className="mt-3 text-xs text-foreground-muted font-sans">
              Or{" "}
              <Link href="/organiser/v2/event/dashboard" className="underline hover:text-foreground">
                manage events
              </Link>{" "}
              while this resolves.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-5 sm:space-y-6">
          <DashboardKpiGrid metrics={displayMetrics} loading={loading} />

          <div className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 items-start">
            <div className="lg:col-span-8">
              <TicketSalesChart
                weekTickets={displayMetrics.weekTickets}
                monthTickets={displayMetrics.monthTickets}
                loading={loading}
              />
            </div>
            <div className="lg:col-span-4">
              <ActivityFeedSection activity={displayMetrics.recentActivity} loading={loading} />
            </div>
          </div>

          <TopSalesDonutSection slices={displayMetrics.salesByEvent30d} loading={loading} />

          <UpcomingEventsSection events={upcoming} loading={loading} variant="full" />
          <DashboardSetupSection
            hasEvents={displayMetrics.events.length > 0}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
}
