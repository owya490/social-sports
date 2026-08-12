import { dateAndTimeInLocalToDate } from "@/services/src/datetimeUtils";

type ShortDateBadgeProps = {
  /** Date instance or ISO date string (`YYYY-MM-DD`). Invalid/empty renders an empty shell. */
  date: Date | string | null | undefined;
  className?: string;
};

function toDate(value: Date | string | null | undefined): Date | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  // Noon local avoids DST edge cases for YYYY-MM-DD calendar chips
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? dateAndTimeInLocalToDate(value, "12:00")
    : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Compact calendar chip: coral month strip + day number (Organiser V2 Event Hub look).
 * Month uses en-AU short form, uppercased (e.g. JUN).
 */
export function ShortDateBadge({ date, className = "" }: ShortDateBadgeProps) {
  const resolved = toDate(date);
  const monthShort = resolved
    ? resolved.toLocaleString("en-AU", { month: "short" }).toUpperCase()
    : "";
  const dayNum = resolved ? String(resolved.getDate()) : "";

  return (
    <div
      className={`flex h-11 w-10 shrink-0 flex-col overflow-hidden rounded-xl border border-border text-center ${className}`.trim()}
      aria-hidden
    >
      <span className="bg-[#FF3B30] text-white flex items-center justify-center leading-none">
        <span className="text-xs font-semibold tracking-wide scale-75 origin-center">{monthShort}</span>
      </span>
      <span className="flex-1 flex items-center justify-center bg-background text-base font-bold text-foreground tabular-nums leading-none">
        {dayNum}
      </span>
    </div>
  );
}
