"use client";

import { useUser } from "@/components/utility/UserContext";
import { TopSalesEventSlice } from "@/services/src/organiser/organiserDashboardMetricsService";
import { accentShadeRamp, resolveProfileColour } from "@/services/src/users/profileColour";
import { displayPrice } from "@/utilities/priceUtils";
import Link from "next/link";
import { useMemo } from "react";
import Skeleton from "react-loading-skeleton";

type TopSalesDonutSectionProps = {
  slices: TopSalesEventSlice[];
  loading: boolean;
};

const RING_SIZE = 64;
const RING_STROKE = 9;
const RING_GAP_DEG = 3;

function polar(cx: number, cy: number, radius: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

function donutSegmentPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startDeg: number,
  endDeg: number,
): string {
  const sweep = endDeg - startDeg;
  if (sweep <= 0.01) return "";

  // A single 360° arc collapses in SVG (start === end). Split into two halves.
  if (sweep >= 359.99) {
    const mid = startDeg + 180;
    return [
      donutSegmentPath(cx, cy, outerR, innerR, startDeg, mid),
      donutSegmentPath(cx, cy, outerR, innerR, mid, startDeg + 360),
    ].join(" ");
  }

  const largeArc = sweep > 180 ? 1 : 0;
  const outerStart = polar(cx, cy, outerR, startDeg);
  const outerEnd = polar(cx, cy, outerR, endDeg);
  const innerEnd = polar(cx, cy, innerR, endDeg);
  const innerStart = polar(cx, cy, innerR, startDeg);

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
}

function formatSalesLabel(cents: number): string {
  const dollars = displayPrice(cents);
  if (dollars >= 1000) {
    return `$${(dollars / 1000).toFixed(dollars >= 10000 ? 0 : 1)}k`;
  }
  return `$${dollars.toLocaleString("en-AU", {
    minimumFractionDigits: dollars % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

function SalesDonut({
  slices,
  totalCents,
  colors,
}: {
  slices: TopSalesEventSlice[];
  totalCents: number;
  colors: string[];
}) {
  const cx = RING_SIZE / 2;
  const cy = RING_SIZE / 2;
  const outerR = RING_SIZE / 2 - 1;
  const innerR = outerR - RING_STROKE;

  const gapCount = slices.length > 1 ? slices.length : 0;
  const usableDeg = 360 - gapCount * RING_GAP_DEG;

  const paths = slices.reduce<
    { key: string; d: string; color: string; cursor: number }[]
  >((acc, slice, index) => {
    const cursor = acc.length > 0 ? acc[acc.length - 1].cursor : 0;
    const share = totalCents > 0 ? slice.salesCents / totalCents : 0;
    const sweep = Math.max(share * usableDeg, 0.5);
    const start = cursor;
    const end = cursor + sweep;
    const nextCursor = end + (gapCount > 0 ? RING_GAP_DEG : 0);

    acc.push({
      key: String(slice.eventId),
      d: donutSegmentPath(cx, cy, outerR, innerR, start, end),
      color: colors[index % colors.length],
      cursor: nextCursor,
    });
    return acc;
  }, []);

  return (
    <div className="relative shrink-0" style={{ width: RING_SIZE, height: RING_SIZE }}>
      <svg
        width={RING_SIZE}
        height={RING_SIZE}
        viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        className="block"
        aria-hidden
      >
        {paths.map((path) =>
          path.d ? <path key={path.key} d={path.d} fill={path.color} /> : null,
        )}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-xs font-medium text-foreground-muted font-sans">Sales</span>
        <span className="mt-0.5 text-xs font-bold tabular-nums text-foreground font-sans">
          {formatSalesLabel(totalCents)}
        </span>
      </div>
    </div>
  );
}

export function TopSalesDonutSection({ slices, loading }: TopSalesDonutSectionProps) {
  const { user } = useUser();
  const totalCents = slices.reduce((sum, slice) => sum + slice.salesCents, 0);
  const hasData = totalCents > 0;

  const sliceColors = useMemo(() => {
    const base = resolveProfileColour(user.profileColour) ?? "#0a0a0a";
    return accentShadeRamp(base, Math.max(slices.length, 1));
  }, [slices.length, user.profileColour]);

  return (
    <section
      aria-label="Top events by sales last 30 days"
      className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto"
    >
      <div className="rounded-xl border border-border bg-background px-3 py-3 sm:px-4 sm:py-3.5 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-4 min-h-[4.75rem]">
        <div className="min-w-0 flex items-baseline gap-2 sm:w-[9.5rem] sm:shrink-0 sm:flex-col sm:items-start sm:gap-0">
          <p className="text-sm font-semibold text-foreground font-sans leading-tight">Top sales</p>
          <p className="text-xs font-medium text-foreground-muted font-sans sm:mt-0.5">
            Last 30 days
          </p>
        </div>

        {loading ? (
          <div className="flex flex-1 items-center gap-3 sm:gap-4 min-w-0">
            <Skeleton circle width={RING_SIZE} height={RING_SIZE} />
            <div className="flex-1 space-y-2 min-w-0">
              <Skeleton height={12} width="70%" />
              <Skeleton height={12} width="55%" />
              <Skeleton height={12} width="40%" />
            </div>
          </div>
        ) : !hasData ? (
          <p className="flex-1 text-xs text-foreground-muted font-sans min-w-0">
            Sales by event will show here once tickets start selling.
          </p>
        ) : (
          <div className="flex flex-1 items-center gap-3 sm:gap-5 min-w-0">
            <SalesDonut slices={slices} totalCents={totalCents} colors={sliceColors} />

            <ul className="flex-1 min-w-0 max-h-[5.5rem] sm:max-h-[4.75rem] overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">
              {slices.map((slice, index) => {
                const color = sliceColors[index % sliceColors.length];
                const content = (
                  <>
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: color }}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate text-xs text-foreground font-sans">
                      {slice.name}
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-foreground-muted font-sans">
                      {formatSalesLabel(slice.salesCents)}
                      <span className="text-foreground-muted/80"> · {slice.percent}%</span>
                    </span>
                  </>
                );

                return (
                  <li key={String(slice.eventId)} className="min-w-0">
                    {slice.eventId === "__other__" ? (
                      <div className="flex items-start gap-2 px-2 py-1.5">{content}</div>
                    ) : (
                      <Link
                        href={`/organiser/v2/event/${slice.eventId}`}
                        className="flex items-start gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                      >
                        {content}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
