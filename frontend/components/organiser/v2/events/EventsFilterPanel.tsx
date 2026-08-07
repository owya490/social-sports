"use client";

import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { CalendarDaysIcon, ChevronDownIcon, XMarkIcon } from "@heroicons/react/24/outline";
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

  const hasDateRange = Boolean(dateRange.from);
  const dateLabel = formatDateRangeLabel(dateRange);

  return (
    <div
      aria-label="Advanced filters"
      role="region"
      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 sm:px-4 sm:py-3"
    >
      <div className="flex flex-wrap items-end gap-x-3 gap-y-2.5">
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground-muted font-sans mb-1.5">Visibility</p>
            <div className="inline-flex rounded-xl border border-border bg-surface p-1">
              {VISIBILITY_OPTIONS.map((option) => {
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

          <div className="min-w-0 w-full sm:w-[12.5rem]">
            <p className="text-xs font-medium text-foreground-muted font-sans mb-1.5">Price (AUD)</p>
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1 min-w-0">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-foreground-muted font-sans">
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
                  className="w-full rounded-xl border border-border bg-background py-1.5 pl-6 pr-2 text-base sm:text-sm text-foreground placeholder:text-foreground-muted font-sans focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  aria-label="Minimum price"
                />
              </div>
              <span className="text-xs text-foreground-muted font-sans shrink-0" aria-hidden>
                –
              </span>
              <div className="relative flex-1 min-w-0">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-foreground-muted font-sans">
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
                  className="w-full rounded-xl border border-border bg-background py-1.5 pl-6 pr-2 text-base sm:text-sm text-foreground placeholder:text-foreground-muted font-sans focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  aria-label="Maximum price"
                />
              </div>
            </div>
          </div>

          <div className="min-w-0 grow sm:grow-0">
            <p className="text-xs font-medium text-foreground-muted font-sans mb-1.5">Dates</p>
            <Popover className="relative">
              {({ close }) => (
                <>
                  <div className="flex items-center gap-1">
                    <PopoverButton
                      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-medium font-sans transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
                        hasDateRange
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-background text-foreground-secondary hover:bg-surface-hover hover:text-foreground"
                      }`}
                    >
                      <CalendarDaysIcon className="h-4 w-4 shrink-0" aria-hidden />
                      <span className="truncate">{dateLabel}</span>
                      <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                    </PopoverButton>
                    {hasDateRange ? (
                      <button
                        type="button"
                        onClick={() => onDateRangeChange({ from: undefined, to: undefined })}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted hover:bg-surface-hover hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                        aria-label="Clear date range"
                      >
                        <XMarkIcon className="h-4 w-4" aria-hidden />
                      </button>
                    ) : null}
                  </div>

                  <PopoverPanel
                    anchor="bottom start"
                    transition
                    className="z-30 origin-top-left rounded-xl border border-border bg-background p-2 shadow-[0_8px_28px_rgba(10,10,10,0.12)] transition duration-150 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
                  >
                    <div className="overflow-hidden text-sm font-sans">
                      <DayPicker
                        mode="range"
                        selected={dateRange}
                        onSelect={(range) =>
                          onDateRangeChange(range ?? { from: undefined, to: undefined })
                        }
                        classNames={dayPickerClassNames}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2 border-t border-border px-1 pt-2 mt-1">
                      <p className="text-xs text-foreground-muted font-sans truncate">
                        {hasDateRange ? dateLabel : "Select a start and end date"}
                      </p>
                      <button
                        type="button"
                        onClick={() => close()}
                        className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold text-foreground font-sans hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                      >
                        Done
                      </button>
                    </div>
                  </PopoverPanel>
                </>
              )}
            </Popover>
          </div>

          <button
            type="button"
            onClick={onClearAll}
            className="ml-auto text-xs font-medium text-foreground-secondary hover:text-foreground font-sans shrink-0 self-end pb-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus rounded"
          >
            Clear all
          </button>
      </div>
    </div>
  );
}
