"use client";

import {
  DATE_ASCENDING_SORTBY_STRING,
  DATE_DESCENDING_SORTBY_STRING,
  HOT_SORTBY_STRING,
  PRICE_ASCENDING_SORTBY_STRING,
  PRICE_DESCENDING_SORTBY_STRING,
  SortByCategory,
  TOP_RATED_SORTBY_STRING,
} from "@/components/Filter/OrganiserFilterDialog";
import { Listbox, Transition } from "@headlessui/react";
import { AdjustmentsHorizontalIcon, CheckIcon, ChevronUpDownIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Fragment } from "react";
import { TimeSegment } from "./useOrganiserEventFilters";

const SORT_OPTIONS = [
  { name: DATE_DESCENDING_SORTBY_STRING, value: SortByCategory.DATE_DESCENDING },
  { name: DATE_ASCENDING_SORTBY_STRING, value: SortByCategory.DATE_ASCENDING },
  { name: HOT_SORTBY_STRING, value: SortByCategory.HOT },
  { name: TOP_RATED_SORTBY_STRING, value: SortByCategory.TOP_RATED },
  { name: PRICE_ASCENDING_SORTBY_STRING, value: SortByCategory.PRICE_ASCENDING },
  { name: PRICE_DESCENDING_SORTBY_STRING, value: SortByCategory.PRICE_DESCENDING },
];

const TIME_SEGMENTS: { label: string; value: TimeSegment }[] = [
  { label: "All", value: "all" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Past", value: "past" },
];

type EventsToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: SortByCategory;
  onSortChange: (value: SortByCategory) => void;
  timeSegment: TimeSegment;
  onTimeSegmentChange: (value: TimeSegment) => void;
  resultCount: number;
  loading: boolean;
  /** When false, hides the Filters control (search / time / sort only). */
  showFilters?: boolean;
  filtersOpen?: boolean;
  onToggleFilters?: () => void;
  activeFilterCount?: number;
  searchPlaceholder?: string;
  searchAriaLabel?: string;
  loadingLabel?: string;
  sectionAriaLabel?: string;
};

export function EventsToolbar({
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  timeSegment,
  onTimeSegmentChange,
  resultCount,
  loading,
  showFilters = true,
  filtersOpen = false,
  onToggleFilters,
  activeFilterCount = 0,
  searchPlaceholder = "Search by name, location, or sport",
  searchAriaLabel = "Search events",
  loadingLabel = "Loading events…",
  sectionAriaLabel = "Search and filter events",
}: EventsToolbarProps) {
  const selectedSort = SORT_OPTIONS.find((option) => option.value === sortBy) ?? SORT_OPTIONS[0];

  return (
    <section
      aria-label={sectionAriaLabel}
      data-tour="events-toolbar"
      className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-3"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1 min-w-0">
          <MagnifyingGlassIcon
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-3 text-base sm:text-sm text-foreground placeholder:text-foreground-muted font-sans focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            aria-label={searchAriaLabel}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className="inline-flex rounded-xl border border-border bg-background p-1"
            role="tablist"
            aria-label="Filter by time"
          >
            {TIME_SEGMENTS.map((segment) => {
              const active = timeSegment === segment.value;
              return (
                <button
                  key={segment.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onTimeSegmentChange(segment.value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium font-sans transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
                    active
                      ? "bg-foreground text-background"
                      : "text-foreground-secondary hover:bg-surface-hover hover:text-foreground"
                  }`}
                >
                  {segment.label}
                </button>
              );
            })}
          </div>

          <Listbox value={selectedSort} onChange={(option) => onSortChange(option.value)}>
            <div className="relative min-w-[9.5rem]">
              <Listbox.Button className="relative w-full cursor-default rounded-xl border border-border bg-background py-2 pl-3 pr-9 text-left text-sm font-medium text-foreground font-sans focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
                <span className="block truncate">{selectedSort.name}</span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
                  <ChevronUpDownIcon className="h-4 w-4 text-foreground-muted" aria-hidden />
                </span>
              </Listbox.Button>
              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-border bg-background py-1 text-sm shadow-sm focus:outline-none">
                  {SORT_OPTIONS.map((option) => (
                    <Listbox.Option
                      key={option.value}
                      value={option}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-9 pr-3 font-sans ${
                          active ? "bg-surface-hover text-foreground" : "text-foreground-secondary"
                        }`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span className={`block truncate ${selected ? "font-semibold text-foreground" : "font-normal"}`}>
                            {option.name}
                          </span>
                          {selected ? (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-foreground">
                              <CheckIcon className="h-4 w-4" aria-hidden />
                            </span>
                          ) : null}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </Listbox>

          {showFilters && onToggleFilters ? (
            <button
              type="button"
              onClick={onToggleFilters}
              aria-expanded={filtersOpen}
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium font-sans transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
                filtersOpen
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-foreground-secondary hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4" aria-hidden />
              Filters
              {activeFilterCount > 0 ? (
                <span
                  className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-semibold tabular-nums ${
                    filtersOpen ? "bg-background text-foreground" : "bg-foreground text-background"
                  }`}
                >
                  {activeFilterCount}
                </span>
              ) : null}
            </button>
          ) : null}
        </div>
      </div>

      <p className="text-xs text-foreground-muted font-sans">
        {loading ? loadingLabel : `${resultCount} result${resultCount === 1 ? "" : "s"}`}
      </p>
    </section>
  );
}
