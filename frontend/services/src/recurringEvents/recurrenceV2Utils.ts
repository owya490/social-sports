import { Timestamp } from "firebase/firestore";
import {
  Frequency,
  MAX_RECURRENCE_OCCURRENCES,
  RecurrenceOccurrence,
  RecurrenceOccurrenceId,
  RecurrenceTemplate,
} from "@/interfaces/RecurringEventTypes";
import { EventId } from "@/interfaces/EventTypes";
import { addCalendarDaysToYmd, dateAndTimeInLocalToTimestamp } from "@/services/src/datetimeUtils";

export const SYDNEY_TIMEZONE = "Australia/Sydney";

export function newOccurrenceId(): RecurrenceOccurrenceId {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID() as RecurrenceOccurrenceId;
  }
  return `occ-${Date.now()}-${Math.random().toString(16).slice(2)}` as RecurrenceOccurrenceId;
}

export function ymdFromTimestampInTimeZone(timestamp: Timestamp, timeZone: string = SYDNEY_TIMEZONE): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(timestamp.toDate());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

export function ymdFromLocalTimestamp(timestamp: Timestamp): string {
  const date = timestamp.toDate();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return asUtc - date.getTime();
}

export function zonedDateTimeToUtc(ymd: string, timeHm: string, timeZone: string): Date {
  const [year, month, day] = ymd.split("-").map(Number);
  const [hours, minutes] = timeHm.split(":").map(Number);
  const utcGuess = Date.UTC(year, month - 1, day, hours || 0, minutes || 0, 0);
  const firstInstant = utcGuess - getTimeZoneOffsetMs(new Date(utcGuess), timeZone);
  return new Date(utcGuess - getTimeZoneOffsetMs(new Date(firstInstant), timeZone));
}

export function sydneyStartOfDayTimestamp(ymd: string): Timestamp {
  return Timestamp.fromDate(zonedDateTimeToUtc(ymd, "00:00", SYDNEY_TIMEZONE));
}

export function defaultCreateDateYmd(eventYmd: string, createDaysBefore: number): string {
  const days = Number.isFinite(createDaysBefore) ? Math.max(0, Math.floor(createDaysBefore)) : 0;
  return addCalendarDaysToYmd(eventYmd, -days);
}

export function addCalendarMonthsToYmd(dateYmd: string, months: number): string {
  const [year, month, day] = dateYmd.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1 + months, day));
  const y = next.getUTCFullYear();
  const m = String(next.getUTCMonth() + 1).padStart(2, "0");
  const d = String(next.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function generateRecurrenceYmds(
  startYmd: string,
  frequency: Frequency,
  extraCount: number
): string[] {
  const extras = Math.max(0, extraCount);
  const dates = [startYmd];
  for (let i = 1; i <= extras; i += 1) {
    if (frequency === Frequency.WEEKLY) {
      dates.push(addCalendarDaysToYmd(startYmd, 7 * i));
    } else if (frequency === Frequency.FORTNIGHTLY) {
      dates.push(addCalendarDaysToYmd(startYmd, 14 * i));
    } else {
      dates.push(addCalendarMonthsToYmd(startYmd, i));
    }
  }
  return dates;
}

export function buildOccurrence(
  eventYmd: string,
  startTimeHm: string,
  createDaysBefore: number,
  existing?: RecurrenceOccurrence
): RecurrenceOccurrence {
  return {
    occurrenceId: existing?.occurrenceId ?? newOccurrenceId(),
    eventStart: dateAndTimeInLocalToTimestamp(eventYmd, startTimeHm),
    createDate: sydneyStartOfDayTimestamp(defaultCreateDateYmd(eventYmd, createDaysBefore)),
    eventId: existing?.eventId,
  };
}

export function occurrencesByLocalYmd(occurrences: RecurrenceOccurrence[]): Map<string, RecurrenceOccurrence> {
  const map = new Map<string, RecurrenceOccurrence>();
  for (const occurrence of occurrences) {
    map.set(ymdFromLocalTimestamp(occurrence.eventStart), occurrence);
  }
  return map;
}

export function upsertOccurrenceDates(
  existing: RecurrenceOccurrence[],
  ymds: string[],
  startTimeHm: string,
  createDaysBefore: number
): RecurrenceOccurrence[] {
  const byYmd = occurrencesByLocalYmd(existing);
  const next: RecurrenceOccurrence[] = [];
  const seen = new Set<string>();
  for (const ymd of ymds) {
    if (seen.has(ymd)) continue;
    seen.add(ymd);
    const previous = byYmd.get(ymd);
    next.push(previous ?? buildOccurrence(ymd, startTimeHm, createDaysBefore));
  }
  next.sort((a, b) => a.eventStart.toMillis() - b.eventStart.toMillis());
  return next.slice(0, MAX_RECURRENCE_OCCURRENCES);
}

export function toggleOccurrenceDate(
  existing: RecurrenceOccurrence[],
  ymd: string,
  startTimeHm: string,
  createDaysBefore: number
): RecurrenceOccurrence[] {
  const current = occurrencesByLocalYmd(existing).get(ymd);
  if (current?.eventId) {
    return existing;
  }
  if (current) {
    return existing.filter((occurrence) => ymdFromLocalTimestamp(occurrence.eventStart) !== ymd);
  }
  if (existing.length >= MAX_RECURRENCE_OCCURRENCES) {
    return existing;
  }
  return [...existing, buildOccurrence(ymd, startTimeHm, createDaysBefore)].sort(
    (a, b) => a.eventStart.toMillis() - b.eventStart.toMillis()
  );
}

export function applyFrequencyHelper(
  existing: RecurrenceOccurrence[],
  startYmd: string,
  frequency: Frequency,
  extraCount: number,
  startTimeHm: string,
  createDaysBefore: number
): RecurrenceOccurrence[] {
  const generated = generateRecurrenceYmds(startYmd, frequency, extraCount);
  const existingYmds = existing.map((occurrence) => ymdFromLocalTimestamp(occurrence.eventStart));
  const mergedYmds = [...existingYmds];
  for (const ymd of generated) {
    if (!mergedYmds.includes(ymd)) {
      mergedYmds.push(ymd);
    }
  }
  return upsertOccurrenceDates(existing, mergedYmds, startTimeHm, createDaysBefore);
}

export function applyCreateDaysBefore(
  occurrences: RecurrenceOccurrence[],
  createDaysBefore: number
): RecurrenceOccurrence[] {
  return occurrences.map((occurrence) => {
    if (occurrence.eventId) {
      return occurrence;
    }
    const eventYmd = ymdFromLocalTimestamp(occurrence.eventStart);
    return {
      ...occurrence,
      createDate: sydneyStartOfDayTimestamp(defaultCreateDateYmd(eventYmd, createDaysBefore)),
    };
  });
}

export function updateOccurrenceCreateDate(
  occurrences: RecurrenceOccurrence[],
  occurrenceId: RecurrenceOccurrenceId,
  createDateYmd: string
): RecurrenceOccurrence[] {
  return occurrences.map((occurrence) => {
    if (occurrence.occurrenceId !== occurrenceId || occurrence.eventId) {
      return occurrence;
    }
    const eventYmd = ymdFromLocalTimestamp(occurrence.eventStart);
    const clamped = createDateYmd > eventYmd ? eventYmd : createDateYmd;
    return {
      ...occurrence,
      createDate: sydneyStartOfDayTimestamp(clamped),
    };
  });
}

export function updateOccurrenceStartTime(
  occurrences: RecurrenceOccurrence[],
  occurrenceId: RecurrenceOccurrenceId,
  startTimeHm: string
): RecurrenceOccurrence[] {
  return occurrences.map((occurrence) => {
    if (occurrence.occurrenceId !== occurrenceId || occurrence.eventId) {
      return occurrence;
    }
    return {
      ...occurrence,
      eventStart: dateAndTimeInLocalToTimestamp(ymdFromLocalTimestamp(occurrence.eventStart), startTimeHm),
    };
  });
}

export function createdEventsFromOccurrences(occurrences: RecurrenceOccurrence[]): Record<string, EventId> {
  const pastEvents: Record<string, EventId> = {};
  for (const occurrence of occurrences) {
    if (occurrence.eventId) {
      pastEvents[occurrence.eventStart.toDate().toISOString()] = occurrence.eventId;
    }
  }
  return pastEvents;
}

export function calculateRecurrenceEndedV2(template: RecurrenceTemplate): boolean {
  const occurrences = template.recurrenceData.occurrences ?? [];
  if (!template.eventData.isActive) {
    return true;
  }
  if (occurrences.length === 0) {
    return true;
  }
  return occurrences.every((occurrence) => Boolean(occurrence.eventId));
}

export function serializeOccurrenceForRequest(occurrence: RecurrenceOccurrence) {
  return {
    occurrenceId: occurrence.occurrenceId,
    eventStart: occurrence.eventStart.toDate().toISOString(),
    createDate: occurrence.createDate.toDate().toISOString(),
    eventId: occurrence.eventId ?? null,
  };
}
