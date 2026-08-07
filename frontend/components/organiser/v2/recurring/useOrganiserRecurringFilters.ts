"use client";

import {
  DEFAULT_SEARCH,
  DEFAULT_SORT_BY_CATEGORY,
  SortByCategory,
} from "@/components/Filter/OrganiserFilterDialog";
import { TimeSegment } from "@/components/organiser/v2/events/useOrganiserEventFilters";
import { RecurrenceTemplate } from "@/interfaces/RecurringEventTypes";
import { calculateRecurrenceEnded } from "@/services/src/recurringEvents/recurringEventsService";
import { Timestamp } from "firebase/firestore";
import { useCallback, useMemo, useState } from "react";

function filterTemplatesBySearch(templates: RecurrenceTemplate[], searchValue: string): RecurrenceTemplate[] {
  if (searchValue === DEFAULT_SEARCH) {
    return templates;
  }
  const query = searchValue.toLowerCase();
  return templates.filter((template) => {
    const { name, location, sport } = template.eventData;
    return (
      name.toLowerCase().includes(query) ||
      location.toLowerCase().includes(query) ||
      sport.toLowerCase().includes(query)
    );
  });
}

function splitTemplatesByTime(templates: RecurrenceTemplate[]) {
  const upcoming: RecurrenceTemplate[] = [];
  const past: RecurrenceTemplate[] = [];
  for (const template of templates) {
    if (calculateRecurrenceEnded(template)) {
      past.push(template);
    } else {
      upcoming.push(template);
    }
  }
  return { upcoming, past };
}

function sortTemplates(templates: RecurrenceTemplate[], sortByCategory: SortByCategory): RecurrenceTemplate[] {
  const list = [...templates];
  switch (sortByCategory) {
    case SortByCategory.HOT:
      list.sort((a, b) => {
        const accessCountDiff = b.eventData.accessCount - a.eventData.accessCount;
        const ticketsSoldDiff =
          b.eventData.capacity -
          b.eventData.vacancy -
          (a.eventData.capacity - a.eventData.vacancy);
        const aPct = (a.eventData.capacity - a.eventData.vacancy) / a.eventData.capacity;
        const bPct = (b.eventData.capacity - b.eventData.vacancy) / b.eventData.capacity;
        return accessCountDiff + ticketsSoldDiff + (bPct - aPct);
      });
      break;
    case SortByCategory.TOP_RATED:
      return list
        .filter((template) => template.eventData.startDate > Timestamp.now())
        .sort((a, b) => b.eventData.accessCount - a.eventData.accessCount);
    case SortByCategory.PRICE_ASCENDING:
      list.sort((a, b) => a.eventData.price - b.eventData.price);
      break;
    case SortByCategory.PRICE_DESCENDING:
      list.sort((a, b) => b.eventData.price - a.eventData.price);
      break;
    case SortByCategory.DATE_ASCENDING:
      list.sort((a, b) => a.eventData.startDate.toMillis() - b.eventData.startDate.toMillis());
      break;
    case SortByCategory.DATE_DESCENDING:
      list.sort((a, b) => b.eventData.startDate.toMillis() - a.eventData.startDate.toMillis());
      break;
    default:
      break;
  }
  return list;
}

export function useOrganiserRecurringFilters(allTemplates: RecurrenceTemplate[]) {
  const [sortBy, setSortBy] = useState<SortByCategory>(DEFAULT_SORT_BY_CATEGORY);
  const [search, setSearch] = useState(DEFAULT_SEARCH);
  const [timeSegment, setTimeSegment] = useState<TimeSegment>("all");

  const clearAll = useCallback(() => {
    setSortBy(DEFAULT_SORT_BY_CATEGORY);
    setSearch(DEFAULT_SEARCH);
    setTimeSegment("all");
  }, []);

  const filteredTemplates = useMemo(() => {
    let list = [...allTemplates];

    list = filterTemplatesBySearch(list, search);

    if (timeSegment === "upcoming") {
      list = splitTemplatesByTime(list).upcoming;
    } else if (timeSegment === "past") {
      list = splitTemplatesByTime(list).past;
    }

    return sortTemplates(list, sortBy);
  }, [allTemplates, search, timeSegment, sortBy]);

  const handleTimeSegmentChange = useCallback((segment: TimeSegment) => {
    setTimeSegment(segment);
  }, []);

  return {
    sortBy,
    setSortBy,
    search,
    setSearch,
    timeSegment,
    handleTimeSegmentChange,
    filteredTemplates,
    clearAll,
  };
}
