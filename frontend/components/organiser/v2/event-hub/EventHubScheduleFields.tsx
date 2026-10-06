"use client";

import {
  addCalendarDaysToYmd,
  dateAndTimeInLocalToDate,
  dateAndTimeInLocalToTimestamp,
  formatDateToString,
  formatStringToDate,
  formatTimeTo12Hour,
  formatTimeTo24Hour,
  timestampToDateString,
  timestampToTimeOfDay,
} from "@/services/src/datetimeUtils";
import { CalendarDaysIcon, ClockIcon } from "@heroicons/react/24/outline";
import { Timestamp } from "firebase/firestore";
import { ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

export const eventHubFieldClass =
  "w-full min-w-0 rounded-xl border-0 bg-transparent py-2.5 pl-9 pr-3 text-base sm:text-sm text-foreground font-sans placeholder:text-foreground-muted focus:outline-none read-only:cursor-text";

export type EventHubScheduleValue = {
  startDate: Timestamp;
  endDate: Timestamp;
  registrationDeadline: Timestamp;
  hasBlockingWarning: boolean;
};

type EventHubScheduleFieldsProps = {
  eventStartDate: Timestamp;
  eventEndDate: Timestamp;
  eventRegistrationDeadline: Timestamp;
  readOnly?: boolean;
  onChange: (value: EventHubScheduleValue) => void;
};

export function EventHubFieldWithIcon({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="relative flex items-center rounded-xl border border-border bg-background focus-within:border-focus focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus">
      <span className="pointer-events-none absolute left-3 text-foreground-muted">{icon}</span>
      {children}
    </div>
  );
}

/** Start, end, and registration deadline — shared by edit details and duplicate. */
export function EventHubScheduleFields({
  eventStartDate,
  eventEndDate,
  eventRegistrationDeadline,
  readOnly = false,
  onChange,
}: EventHubScheduleFieldsProps) {
  const [startDate, setStartDate] = useState(timestampToDateString(eventStartDate));
  const [startTime, setStartTime] = useState(timestampToTimeOfDay(eventStartDate));
  const [endDate, setEndDate] = useState(timestampToDateString(eventEndDate));
  const [endTime, setEndTime] = useState(timestampToTimeOfDay(eventEndDate));
  const [registrationDeadlineDate, setRegistrationDeadlineDate] = useState(
    timestampToDateString(eventRegistrationDeadline)
  );
  const [registrationDeadlineTime, setRegistrationDeadlineTime] = useState(
    timestampToTimeOfDay(eventRegistrationDeadline)
  );

  const prevStartDateRef = useRef<string | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const nextStartDate = timestampToDateString(eventStartDate);
    setStartDate(nextStartDate);
    setStartTime(timestampToTimeOfDay(eventStartDate));
    setEndDate(timestampToDateString(eventEndDate));
    setEndTime(timestampToTimeOfDay(eventEndDate));
    setRegistrationDeadlineDate(timestampToDateString(eventRegistrationDeadline));
    setRegistrationDeadlineTime(timestampToTimeOfDay(eventRegistrationDeadline));
    // Hydration is not a user start-date change — keep the event's real end date.
    prevStartDateRef.current = nextStartDate;
  }, [eventStartDate, eventEndDate, eventRegistrationDeadline]);

  useEffect(() => {
    const prevStartDate = prevStartDateRef.current;
    prevStartDateRef.current = startDate;

    // Skip mount / hydration — only shift when the organiser changes start date.
    if (prevStartDate === null || prevStartDate === startDate) {
      return;
    }

    const prevYmd = formatStringToDate(prevStartDate);
    const nextYmd = formatStringToDate(startDate);
    const [prevY, prevM, prevD] = prevYmd.split("-").map(Number);
    const [nextY, nextM, nextD] = nextYmd.split("-").map(Number);
    const dayDelta = Math.round(
      (Date.UTC(nextY, nextM - 1, nextD) - Date.UTC(prevY, prevM - 1, prevD)) / (24 * 60 * 60 * 1000)
    );
    if (dayDelta !== 0) {
      const shiftedEndYmd = addCalendarDaysToYmd(formatStringToDate(endDate), dayDelta);
      setEndDate(formatDateToString(shiftedEndYmd < nextYmd ? nextYmd : shiftedEndYmd));
    }

    setRegistrationDeadlineDate(startDate);
    setRegistrationDeadlineTime(startTime);
    // endDate/startTime intentionally read from the change that triggered this effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate]);

  const warnings = useMemo(() => {
    const currentDateTime = new Date();
    const selectedStartDateTime = dateAndTimeInLocalToDate(
      formatStringToDate(startDate),
      formatTimeTo24Hour(startTime)
    );
    const selectedEndDateTime = dateAndTimeInLocalToDate(formatStringToDate(endDate), formatTimeTo24Hour(endTime));
    const selectedRegistrationDeadline = dateAndTimeInLocalToDate(
      formatStringToDate(registrationDeadlineDate),
      formatTimeTo24Hour(registrationDeadlineTime)
    );

    return {
      dateWarning: currentDateTime > selectedEndDateTime ? "Event end date and time is in the past!" : null,
      timeWarning: selectedEndDateTime < selectedStartDateTime ? "Event must end after it starts!" : null,
      registrationDeadlineWarning:
        selectedRegistrationDeadline > selectedEndDateTime ? "Registration deadline is after event end!" : null,
    };
  }, [startDate, startTime, endDate, endTime, registrationDeadlineDate, registrationDeadlineTime]);

  useLayoutEffect(() => {
    const hasBlockingWarning =
      !readOnly &&
      Boolean(warnings.dateWarning || warnings.timeWarning || warnings.registrationDeadlineWarning);
    onChangeRef.current({
      startDate: dateAndTimeInLocalToTimestamp(formatStringToDate(startDate), formatTimeTo24Hour(startTime)),
      endDate: dateAndTimeInLocalToTimestamp(formatStringToDate(endDate), formatTimeTo24Hour(endTime)),
      registrationDeadline: dateAndTimeInLocalToTimestamp(
        formatStringToDate(registrationDeadlineDate),
        formatTimeTo24Hour(registrationDeadlineTime)
      ),
      hasBlockingWarning,
    });
  }, [
    startDate,
    startTime,
    endDate,
    endTime,
    registrationDeadlineDate,
    registrationDeadlineTime,
    warnings,
    readOnly,
  ]);

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground-muted font-sans">Time</h3>
      <div className="space-y-3">
        <TimeRow
          label="Start"
          filled
          dateValue={formatStringToDate(startDate)}
          timeValue={formatTimeTo24Hour(startTime)}
          onDateChange={(v) => setStartDate(formatDateToString(v))}
          onTimeChange={(v) => setStartTime(formatTimeTo12Hour(v))}
          readOnly={readOnly}
        />
        <TimeRow
          label="End"
          filled={false}
          dateValue={formatStringToDate(endDate)}
          timeValue={formatTimeTo24Hour(endTime)}
          onDateChange={(v) => setEndDate(formatDateToString(v))}
          onTimeChange={(v) => setEndTime(formatTimeTo12Hour(v))}
          readOnly={readOnly}
        />
        <div className="pt-1">
          <p className="text-xs font-medium text-foreground-muted font-sans mb-2">Registration deadline</p>
          <div className="grid grid-cols-2 gap-2">
            <EventHubFieldWithIcon icon={<CalendarDaysIcon className="h-4 w-4" aria-hidden />}>
              <input
                type="date"
                value={formatStringToDate(registrationDeadlineDate)}
                onChange={(e) => setRegistrationDeadlineDate(formatDateToString(e.target.value))}
                className={eventHubFieldClass}
                aria-label="Registration deadline date"
                readOnly={readOnly}
              />
            </EventHubFieldWithIcon>
            <EventHubFieldWithIcon icon={<ClockIcon className="h-4 w-4" aria-hidden />}>
              <input
                type="time"
                value={formatTimeTo24Hour(registrationDeadlineTime)}
                onChange={(e) => setRegistrationDeadlineTime(formatTimeTo12Hour(e.target.value))}
                className={eventHubFieldClass}
                aria-label="Registration deadline time"
                readOnly={readOnly}
              />
            </EventHubFieldWithIcon>
          </div>
        </div>
      </div>
      {!readOnly && warnings.dateWarning ? <ScheduleWarning>{warnings.dateWarning}</ScheduleWarning> : null}
      {!readOnly && warnings.timeWarning ? <ScheduleWarning>{warnings.timeWarning}</ScheduleWarning> : null}
      {!readOnly && warnings.registrationDeadlineWarning ? (
        <ScheduleWarning>{warnings.registrationDeadlineWarning}</ScheduleWarning>
      ) : null}
    </section>
  );
}

function TimeRow({
  label,
  filled,
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  readOnly = false,
}: {
  label: string;
  filled: boolean;
  dateValue: string;
  timeValue: string;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center pt-3" aria-hidden>
        <span
          className={`h-2.5 w-2.5 rounded-full border-2 ${
            filled ? "border-foreground bg-foreground" : "border-foreground-muted bg-background"
          }`}
        />
        {filled ? <span className="mt-1 w-px flex-1 min-h-[2.5rem] bg-border" /> : null}
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="text-xs font-medium text-foreground-muted font-sans">{label}</p>
        <div className="grid grid-cols-2 gap-2">
          <EventHubFieldWithIcon icon={<CalendarDaysIcon className="h-4 w-4" aria-hidden />}>
            <input
              type="date"
              value={dateValue}
              onChange={(e) => onDateChange(e.target.value)}
              className={eventHubFieldClass}
              aria-label={`${label} date`}
              readOnly={readOnly}
            />
          </EventHubFieldWithIcon>
          <EventHubFieldWithIcon icon={<ClockIcon className="h-4 w-4" aria-hidden />}>
            <input
              type="time"
              value={timeValue}
              onChange={(e) => onTimeChange(e.target.value)}
              className={eventHubFieldClass}
              aria-label={`${label} time`}
              readOnly={readOnly}
            />
          </EventHubFieldWithIcon>
        </div>
      </div>
    </div>
  );
}

function ScheduleWarning({ children }: { children: ReactNode }) {
  return <p className="text-sm text-danger font-sans mt-2">{children}</p>;
}
