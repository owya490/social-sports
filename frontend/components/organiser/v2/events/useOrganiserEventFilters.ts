"use client";

import {
  DEFAULT_DATE_RANGE,
  DEFAULT_EVENT_TYPE,
  DEFAULT_MAX_PRICE,
  DEFAULT_MIN_PRICE,
  DEFAULT_SEARCH,
  DEFAULT_SORT_BY_CATEGORY,
  SortByCategory,
} from "@/components/Filter/OrganiserFilterDialog";
import { splitEventsByTime } from "@/components/organiser/v2/dashboard/computeDashboardStats";
import { EventData } from "@/interfaces/EventTypes";
import { setDateToEndOfDay, setDateToStartOfDay } from "@/services/src/datetimeUtils";
import {
  filterEventsByDate,
  filterEventsByPrice,
  filterEventsBySearch,
  filterEventsBySortBy,
  filterEventsByType,
} from "@/services/src/filterService";
import { Timestamp } from "firebase/firestore";
import { useCallback, useMemo, useState } from "react";
import { DateRange } from "react-day-picker";

export type TimeSegment = "all" | "upcoming" | "past";

export function useOrganiserEventFilters(allEvents: EventData[]) {
  const [sortBy, setSortBy] = useState<SortByCategory>(DEFAULT_SORT_BY_CATEGORY);
  const [search, setSearch] = useState(DEFAULT_SEARCH);
  const [eventType, setEventType] = useState(DEFAULT_EVENT_TYPE);
  const [minPrice, setMinPrice] = useState<number | null>(DEFAULT_MIN_PRICE);
  const [maxPrice, setMaxPrice] = useState<number | null>(DEFAULT_MAX_PRICE);
  const [dateRange, setDateRange] = useState<DateRange>(DEFAULT_DATE_RANGE);
  const [timeSegment, setTimeSegment] = useState<TimeSegment>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const clearAdvancedFilters = useCallback(() => {
    setEventType(DEFAULT_EVENT_TYPE);
    setMinPrice(DEFAULT_MIN_PRICE);
    setMaxPrice(DEFAULT_MAX_PRICE);
    setDateRange(DEFAULT_DATE_RANGE);
  }, []);

  const clearAll = useCallback(() => {
    setSortBy(DEFAULT_SORT_BY_CATEGORY);
    setSearch(DEFAULT_SEARCH);
    setTimeSegment("all");
    clearAdvancedFilters();
  }, [clearAdvancedFilters]);

  const filteredEvents = useMemo(() => {
    let list = [...allEvents];

    if (search !== DEFAULT_SEARCH) {
      list = filterEventsBySearch(list, search);
    }

    if (timeSegment === "upcoming") {
      list = splitEventsByTime(list).upcoming;
    } else if (timeSegment === "past") {
      list = splitEventsByTime(list).past;
    }

    if (eventType !== DEFAULT_EVENT_TYPE) {
      list = filterEventsByType(list, eventType);
    }

    const min = minPrice !== DEFAULT_MIN_PRICE ? minPrice : 0;
    const max = maxPrice !== DEFAULT_MAX_PRICE ? maxPrice : 999999;
    if (minPrice !== DEFAULT_MIN_PRICE || maxPrice !== DEFAULT_MAX_PRICE) {
      list = filterEventsByPrice(list, min ?? 0, max ?? 999999);
    }

    if (dateRange.from && dateRange.to) {
      const startDateObj = setDateToStartOfDay(dateRange.from);
      const endDateObj = setDateToEndOfDay(dateRange.to);
      list = filterEventsByDate(
        list,
        Timestamp.fromDate(startDateObj),
        Timestamp.fromDate(endDateObj),
      );
    }

    return filterEventsBySortBy(list, sortBy);
  }, [
    allEvents,
    search,
    timeSegment,
    eventType,
    minPrice,
    maxPrice,
    dateRange,
    sortBy,
  ]);

  /** Counts only filters owned by the Filters side panel (not search / time / sort). */
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (eventType !== DEFAULT_EVENT_TYPE) count += 1;
    if (minPrice !== DEFAULT_MIN_PRICE || maxPrice !== DEFAULT_MAX_PRICE) count += 1;
    if (dateRange.from && dateRange.to) count += 1;
    return count;
  }, [eventType, minPrice, maxPrice, dateRange]);

  const handleTimeSegmentChange = useCallback((segment: TimeSegment) => {
    setTimeSegment(segment);
  }, []);

  return {
    sortBy,
    setSortBy,
    search,
    setSearch,
    eventType,
    setEventType,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    dateRange,
    setDateRange,
    timeSegment,
    handleTimeSegmentChange,
    filtersOpen,
    setFiltersOpen,
    filteredEvents,
    activeFilterCount,
    clearAdvancedFilters,
    clearAll,
  };
}
