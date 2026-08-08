"use client";

import { CalendarDaysIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { DateRange, DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

type EventsFilterPanelProps = {
  eventType: string;
  onEventTypeChange: (value: string) => void;
  minPrice: number | null;
  onMinPriceChange: (value: number | null) => void;
  maxPrice: number | null;
  onMaxPriceChange: (value: number | null) => void;
  dateRange: DateRange;
  onDateRangeChange: (value: DateRange) => void;
};

function toggleTypeValue(current: string, value: string): string {
  return current === value ? "" : value;
}

function formatDateRangeLabel(dateRange: DateRange): string {
  if (!dateRange.from) return "Any dates";
  const from = dateRange.from.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
  });
  if (!dateRange.to) return from;
  const to = dateRange.to.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
  });
  return `${from} – ${to}`;
}

const VISIBILITY_OPTIONS = [
  { label: "All", value: "" },
  { label: "Public", value: "public" },
  { label: "Private", value: "private" },
] as const;

const dayPickerClassNames = {
  selected: "bg-foreground text-background rounded-full",
  range_start: "bg-foreground text-background rounded-full",
  range_end: "bg-foreground text-background rounded-full",
  range_middle: "bg-surface-muted text-foreground rounded-full",
  today: "text-foreground font-semibold",
  chevron: "text-foreground",
  disabled: "text-foreground-muted cursor-not-allowed",
};

const fieldClass =
  "w-full rounded-xl border border-border bg-background py-2.5 pl-7 pr-3 text-base sm:text-sm text-foreground placeholder:text-foreground-muted font-sans focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

/**
 * Advanced event filters — body for EventHubPanel (visibility, price, dates).
 * Search / time / sort stay on the toolbar.
 */
export function EventsFilterPanel({
  eventType,
  onEventTypeChange,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  dateRange,
  onDateRangeChange,
}: EventsFilterPanelProps) {
  const hasDateRange = Boolean(dateRange.from);
  const dateLabel = formatDateRangeLabel(dateRange);

  return (
    <div className="space-y-6" aria-label="Advanced filters">
      <div>
        <p className="text-xs font-medium text-foreground-muted font-sans mb-2">Visibility</p>
        <div className="inline-flex w-full rounded-xl border border-border bg-surface p-1">
          {VISIBILITY_OPTIONS.map((option) => {
            const active = eventType === option.value;
            return (
              <button
                key={option.label}
                type="button"
                onClick={() => onEventTypeChange(toggleTypeValue(eventType, option.value))}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium font-sans transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
                  active
                    ? "bg-foreground text-background"
                    : "text-foreground-secondary hover:bg-surface-hover hover:text-foreground"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-foreground-muted font-sans mb-2">Price (AUD)</p>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-foreground-muted font-sans">
              $
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              placeholder="Min"
              value={minPrice ?? ""}
              onChange={(event) => {
                const parsed = parseFloat(event.target.value);
                onMinPriceChange(event.target.value === "" || Number.isNaN(parsed) ? null : parsed);
              }}
              className={fieldClass}
              aria-label="Minimum price"
            />
          </div>
          <span className="text-sm text-foreground-muted font-sans shrink-0" aria-hidden>
            –
          </span>
          <div className="relative flex-1 min-w-0">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-foreground-muted font-sans">
              $
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              placeholder="Max"
              value={maxPrice ?? ""}
              onChange={(event) => {
                const parsed = parseFloat(event.target.value);
                onMaxPriceChange(event.target.value === "" || Number.isNaN(parsed) ? null : parsed);
              }}
              className={fieldClass}
              aria-label="Maximum price"
            />
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-xs font-medium text-foreground-muted font-sans">Dates</p>
          {hasDateRange ? (
            <button
              type="button"
              onClick={() => onDateRangeChange({ from: undefined, to: undefined })}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-foreground-secondary hover:bg-surface-hover hover:text-foreground font-sans focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              aria-label="Clear date range"
            >
              <XMarkIcon className="h-3.5 w-3.5" aria-hidden />
              Clear
            </button>
          ) : null}
        </div>
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
            <CalendarDaysIcon className="h-4 w-4 shrink-0 text-foreground-muted" aria-hidden />
            <p className="min-w-0 truncate text-sm font-medium text-foreground font-sans">{dateLabel}</p>
          </div>
          <div className="flex justify-center overflow-x-auto p-2 text-sm font-sans">
            <DayPicker
              mode="range"
              selected={dateRange}
              onSelect={(range) => onDateRangeChange(range ?? { from: undefined, to: undefined })}
              classNames={dayPickerClassNames}
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-foreground-muted font-sans">
          {hasDateRange ? "Showing events in this range." : "Select a start and end date."}
        </p>
      </div>
    </div>
  );
}
