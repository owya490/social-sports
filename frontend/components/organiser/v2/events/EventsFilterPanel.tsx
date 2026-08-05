"use client";

import { DateRange, DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

type EventsFilterPanelProps = {
  open: boolean;
  eventType: string;
  onEventTypeChange: (value: string) => void;
  minPrice: number | null;
  onMinPriceChange: (value: number | null) => void;
  maxPrice: number | null;
  onMaxPriceChange: (value: number | null) => void;
  dateRange: DateRange;
  onDateRangeChange: (value: DateRange) => void;
  onClearAll: () => void;
};

function toggleTypeValue(current: string, value: string): string {
  return current === value ? "" : value;
}

export function EventsFilterPanel({
  open,
  eventType,
  onEventTypeChange,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  dateRange,
  onDateRangeChange,
  onClearAll,
}: EventsFilterPanelProps) {
  if (!open) return null;

  return (
    <section
      aria-label="Advanced filters"
      className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto"
    >
      <div className="rounded-xl border border-border bg-background p-4 sm:p-5 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-sans text-base font-semibold text-foreground">Advanced filters</h2>
            <p className="mt-0.5 text-xs text-foreground-muted font-sans">
              Narrow by visibility, price, or date range
            </p>
          </div>
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs font-medium text-foreground-secondary hover:text-foreground font-sans shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus rounded"
          >
            Clear all
          </button>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <div>
            <p className="text-xs font-medium text-foreground-muted font-sans mb-2">Visibility</p>
            <div className="inline-flex rounded-xl border border-border bg-surface p-1">
              {[
                { label: "All", value: "" },
                { label: "Public", value: "public" },
                { label: "Private", value: "private" },
              ].map((option) => {
                const active = eventType === option.value;
                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => onEventTypeChange(toggleTypeValue(eventType, option.value))}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium font-sans transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
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
            <p className="text-xs font-medium text-foreground-muted font-sans mb-2">Price range (AUD)</p>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-foreground-muted font-sans">
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
                  className="w-full rounded-xl border border-border bg-background py-2 pl-7 pr-3 text-base sm:text-sm text-foreground placeholder:text-foreground-muted font-sans focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  aria-label="Minimum price"
                />
              </div>
              <span className="text-xs text-foreground-muted font-sans">to</span>
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-foreground-muted font-sans">
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
                  className="w-full rounded-xl border border-border bg-background py-2 pl-7 pr-3 text-base sm:text-sm text-foreground placeholder:text-foreground-muted font-sans focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  aria-label="Maximum price"
                />
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-foreground-muted font-sans mb-2">Date range</p>
            <div className="rounded-xl border border-border bg-surface p-2 flex justify-center overflow-hidden text-sm font-sans">
              <DayPicker
                mode="range"
                selected={dateRange}
                onSelect={(range) => onDateRangeChange(range ?? { from: undefined, to: undefined })}
                classNames={{
                  selected: "bg-foreground text-background rounded-full",
                  range_start: "bg-foreground text-background rounded-full",
                  range_end: "bg-foreground text-background rounded-full",
                  range_middle: "bg-surface-muted text-foreground rounded-full",
                  today: "text-foreground font-semibold",
                  chevron: "text-foreground",
                  disabled: "text-foreground-muted cursor-not-allowed",
                }}
              />
            </div>
            {dateRange.from ? (
              <p className="mt-2 text-xs text-foreground-muted font-sans text-center">
                {dateRange.from.toLocaleDateString("en-AU")}
                {dateRange.to ? ` – ${dateRange.to.toLocaleDateString("en-AU")}` : ""}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
