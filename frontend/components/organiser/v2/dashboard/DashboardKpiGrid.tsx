"use client";

import { OrganiserDashboardMetrics } from "@/services/src/organiser/organiserDashboardMetricsService";
import { displayPrice } from "@/utilities/priceUtils";
import {
  ArrowTrendingUpIcon,
  EyeIcon,
  TicketIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import Skeleton from "react-loading-skeleton";

type DashboardKpiGridProps = {
  metrics: OrganiserDashboardMetrics | null;
  loading: boolean;
};

type KpiItem = {
  label: string;
  value: string;
  detail: string;
  icon: typeof CurrencyDollarIcon;
};

function KpiCell({ item, loading }: { item: KpiItem; loading: boolean }) {
  const Icon = item.icon;

  return (
    <div className="rounded-xl bg-background border border-border px-3 py-3 sm:px-4 sm:py-3.5 min-w-0 flex gap-3 items-start">
      <div className="rounded-lg bg-surface p-2 shrink-0">
        <Icon className="h-4 w-4 text-foreground-secondary" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-foreground-muted font-sans truncate">{item.label}</p>
        <div className="mt-0.5 font-sans text-xl sm:text-2xl font-bold text-foreground tabular-nums tracking-tight leading-tight truncate">
          {loading ? <Skeleton width={72} height={26} /> : item.value}
        </div>
        <p className="mt-0.5 text-xs text-foreground-muted font-sans truncate">{item.detail}</p>
      </div>
    </div>
  );
}

export function DashboardKpiGrid({ metrics, loading }: DashboardKpiGridProps) {
  const netSales = metrics
    ? `$${displayPrice(metrics.netSales30dCents).toLocaleString("en-AU", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : "—";
  const tickets = metrics ? metrics.ticketsSold30d.toLocaleString("en-AU") : "—";
  const views = metrics ? metrics.totalPageViews.toLocaleString("en-AU") : "—";
  const conversion = metrics ? `${metrics.conversionRate}%` : "—";

  const items: KpiItem[] = [
    { label: "Net sales", value: netSales, detail: "Last 30 days", icon: CurrencyDollarIcon },
    { label: "Tickets sold", value: tickets, detail: "Last 30 days", icon: TicketIcon },
    { label: "Page views", value: views, detail: "All time per event", icon: EyeIcon },
    { label: "Conversion", value: conversion, detail: "Approx.", icon: ArrowTrendingUpIcon },
  ];

  return (
    <section aria-label="Key metrics" className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {items.map((item) => (
          <KpiCell key={item.label} item={item} loading={loading} />
        ))}
      </div>
    </section>
  );
}
