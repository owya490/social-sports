"use client";

import {
  buildMonthGrid,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  weekDayLabels,
} from "@/components/organiser/v2/calendar/calendarUtils";
import { MAX_RECURRENCE_AMOUNT } from "@/components/events/create/forms/RecurringEventsForm";
import { Frequency, NewRecurrenceFormData, RecurrenceOccurrence } from "@/interfaces/RecurringEventTypes";
import {
  applyCreateDaysBefore,
  applyFrequencyHelper,
  defaultCreateDateYmd,
  toggleOccurrenceDate,
  updateOccurrenceCreateDate,
  updateOccurrenceStartTime,
  ymdFromLocalTimestamp,
  ymdFromTimestampInTimeZone,
} from "@/services/src/recurringEvents/recurrenceV2Utils";
import { RecurringEventsFrequencyMetadata } from "@/services/src/recurringEvents/recurringEventsConstants";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { Timestamp } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";

type RecurrenceCalendarEditorProps = {
  startDateYmd: string;
  startTimeHm: string;
  value: NewRecurrenceFormData;
  onChange: (data: NewRecurrenceFormData) => void;
};

const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: Frequency.WEEKLY, label: "Weekly" },
  { value: Frequency.FORTNIGHTLY, label: "Fortnightly" },
  { value: Frequency.MONTHLY, label: "Monthly" },
];

function formatOccurrenceDate(timestamp: Timestamp): string {
  return timestamp.toDate().toLocaleString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function timeHmFromTimestamp(timestamp: Timestamp): string {
  const date = timestamp.toDate();
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function RecurrenceCalendarEditor({
  startDateYmd,
  startTimeHm,
  value,
  onChange,
}: RecurrenceCalendarEditorProps) {
  const occurrences = useMemo(() => value.occurrences ?? [], [value.occurrences]);
  const [month, setMonth] = useState(() => {
    const [year, monthIndex] = startDateYmd.split("-").map(Number);
    return new Date(year, monthIndex - 1, 1);
  });

  useEffect(() => {
    if (occurrences.length > 0) {
      return;
    }
    onChange({
      ...value,
      occurrences: toggleOccurrenceDate([], startDateYmd, startTimeHm, value.createDaysBefore),
    });
    // Seed the form start date once when the editor opens empty.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedYmds = useMemo(
    () => new Set(occurrences.map((occurrence) => ymdFromLocalTimestamp(occurrence.eventStart))),
    [occurrences]
  );
  const createdYmds = useMemo(
    () =>
      new Set(
        occurrences
          .filter((occurrence) => occurrence.eventId)
          .map((occurrence) => ymdFromLocalTimestamp(occurrence.eventStart))
      ),
    [occurrences]
  );

  const days = useMemo(() => buildMonthGrid(month), [month]);
  const weekdayLabels = useMemo(() => weekDayLabels(month), [month]);
  const maxCreateDays = RecurringEventsFrequencyMetadata[value.frequency].maxPriorDaysForEventCreation;

  const setOccurrences = (nextOccurrences: RecurrenceOccurrence[]) => {
    onChange({ ...value, occurrences: nextOccurrences });
  };

  const handleToggleDay = (day: Date) => {
    const ymd = format(day, "yyyy-MM-dd");
    setOccurrences(toggleOccurrenceDate(occurrences, ymd, startTimeHm, value.createDaysBefore));
  };

  const handleApplyHelper = () => {
    setOccurrences(
      applyFrequencyHelper(
        occurrences,
        startDateYmd,
        value.frequency,
        value.recurrenceAmount,
        startTimeHm,
        value.createDaysBefore
      )
    );
  };

  const handleCreateDaysBeforeChange = (createDaysBefore: number) => {
    onChange({
      ...value,
      createDaysBefore,
      occurrences: applyCreateDaysBefore(occurrences, createDaysBefore),
    });
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-foreground-muted font-sans leading-relaxed">
        Select the dates this event should run. Weekly, fortnightly, and monthly helpers fill dates for you — then
        deselect or edit any row.
      </p>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,18rem)]">
        <section className="rounded-xl border border-border bg-background p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground font-sans">
              {format(month, "MMMM yyyy")}
            </h3>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => setMonth(startOfMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1)))}
                className="rounded-lg p-1.5 text-foreground-muted hover:bg-surface-hover hover:text-foreground"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setMonth(startOfMonth(new Date()))}
                className="rounded-lg px-2 py-1 text-xs font-medium text-foreground-secondary hover:bg-surface-hover"
              >
                Today
              </button>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => setMonth(startOfMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1)))}
                className="rounded-lg p-1.5 text-foreground-muted hover:bg-surface-hover hover:text-foreground"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 text-center text-[11px] font-medium text-foreground-muted">
            {weekdayLabels.map((label) => (
              <div key={label} className="py-1">
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 border-t border-s border-border">
            {days.map((day) => {
              const ymd = format(day, "yyyy-MM-dd");
              const selected = selectedYmds.has(ymd);
              const created = createdYmds.has(ymd);
              const outside = !isSameMonth(day, month);
              const today = isToday(day);
              return (
                <button
                  key={ymd}
                  type="button"
                  disabled={created}
                  aria-pressed={selected}
                  onClick={() => handleToggleDay(day)}
                  className={`min-h-[2.75rem] border-b border-e border-border px-1 py-1 text-sm font-sans ${
                    outside ? "text-foreground-muted/60" : "text-foreground"
                  } ${selected ? "bg-surface-muted font-semibold" : "hover:bg-surface-hover"} ${
                    created ? "cursor-not-allowed opacity-70" : ""
                  }`}
                >
                  <span
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${
                      today ? "ring-1 ring-foreground" : ""
                    } ${selected ? "bg-foreground text-background" : ""}`}
                  >
                    {format(day, "d")}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <fieldset>
            <legend className="text-xs font-medium text-foreground-muted font-sans mb-2">Fill dates</legend>
            <div className="flex flex-wrap gap-2">
              {FREQUENCY_OPTIONS.map((option) => {
                const active = value.frequency === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      const max =
                        RecurringEventsFrequencyMetadata[option.value].maxPriorDaysForEventCreation;
                      const createDaysBefore = Math.min(value.createDaysBefore, max);
                      onChange({
                        ...value,
                        frequency: option.value,
                        createDaysBefore,
                        occurrences:
                          createDaysBefore === value.createDaysBefore
                            ? value.occurrences
                            : applyCreateDaysBefore(occurrences, createDaysBefore),
                      });
                    }}
                    className={`rounded-xl border px-3 py-1.5 text-sm font-medium font-sans ${
                      active
                        ? "border-foreground bg-surface-muted text-foreground"
                        : "border-border bg-background text-foreground-secondary hover:bg-surface-hover"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <label className="block text-xs font-medium text-foreground-muted font-sans">
            Extra dates
            <select
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground"
              value={value.recurrenceAmount}
              onChange={(event) => onChange({ ...value, recurrenceAmount: Number(event.target.value) })}
            >
              {Array.from({ length: MAX_RECURRENCE_AMOUNT }, (_, index) => index + 1).map((amount) => (
                <option key={amount} value={amount}>
                  {amount} {amount === 1 ? "time" : "times"}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-foreground-muted font-sans">
            Create days before
            <select
              className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground"
              value={value.createDaysBefore}
              onChange={(event) => handleCreateDaysBeforeChange(Number(event.target.value))}
            >
              {Array.from({ length: maxCreateDays }, (_, index) => index + 1).map((days) => (
                <option key={days} value={days}>
                  {days} {days === 1 ? "day" : "days"}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={handleApplyHelper}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-hover"
          >
            Add {value.frequency.toLowerCase()} dates
          </button>
        </section>
      </div>

      <section>
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h3 className="text-sm font-semibold text-foreground font-sans">Selected dates</h3>
          <p className="text-xs text-foreground-muted font-sans tabular-nums">
            {occurrences.length} {occurrences.length === 1 ? "date" : "dates"}
          </p>
        </div>
        {occurrences.length === 0 ? (
          <p className="text-sm text-foreground-muted font-sans">Select at least one date on the calendar.</p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {occurrences.map((occurrence) => {
              const eventYmd = ymdFromLocalTimestamp(occurrence.eventStart);
              const createYmd = ymdFromTimestampInTimeZone(occurrence.createDate);
              const created = Boolean(occurrence.eventId);
              return (
                <li key={occurrence.occurrenceId} className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground font-sans">
                      {formatOccurrenceDate(occurrence.eventStart)}
                    </p>
                    {created ? (
                      <p className="text-xs text-foreground-muted font-sans">Already created</p>
                    ) : null}
                  </div>
                  <label className="text-xs text-foreground-muted font-sans">
                    Time
                    <input
                      type="time"
                      disabled={created}
                      value={timeHmFromTimestamp(occurrence.eventStart)}
                      onChange={(event) =>
                        setOccurrences(
                          updateOccurrenceStartTime(occurrences, occurrence.occurrenceId, event.target.value)
                        )
                      }
                      className="mt-1 block rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground disabled:opacity-60"
                    />
                  </label>
                  <label className="text-xs text-foreground-muted font-sans">
                    Create on
                    <input
                      type="date"
                      disabled={created}
                      max={eventYmd}
                      value={createYmd}
                      onChange={(event) =>
                        setOccurrences(
                          updateOccurrenceCreateDate(
                            occurrences,
                            occurrence.occurrenceId,
                            event.target.value || defaultCreateDateYmd(eventYmd, value.createDaysBefore)
                          )
                        )
                      }
                      className="mt-1 block rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground disabled:opacity-60"
                    />
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
