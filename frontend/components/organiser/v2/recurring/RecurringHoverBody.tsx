"use client";

import { HoverList } from "@/components/organiser/v2/shared/EntityHoverPreview";
import { Frequency, RecurrenceTemplate, isRecurrenceTemplateV2 } from "@/interfaces/RecurringEventTypes";
import { timestampToEventCardDateString } from "@/services/src/datetimeUtils";
import { calculateRecurrenceEnded } from "@/services/src/recurringEvents/recurringEventsService";
import { Timestamp } from "firebase/firestore";

function frequencyLabel(frequency: Frequency): string {
  switch (frequency) {
    case Frequency.WEEKLY:
      return "Weekly";
    case Frequency.FORTNIGHTLY:
      return "Fortnightly";
    case Frequency.MONTHLY:
      return "Monthly";
    default:
      return frequency;
  }
}

function upcomingRecurrences(allRecurrences: Timestamp[], limit = 2): Timestamp[] {
  const now = Date.now();
  return allRecurrences
    .filter((ts) => ts.toMillis() >= now)
    .sort((a, b) => a.toMillis() - b.toMillis())
    .slice(0, limit);
}

function scheduleSettings(template: RecurrenceTemplate): string {
  if (isRecurrenceTemplateV2(template)) {
    const count = template.recurrenceData.occurrences?.length ?? 0;
    return `${count} ${count === 1 ? "date" : "dates"}`;
  }
  return `${frequencyLabel(template.recurrenceData.frequency ?? Frequency.WEEKLY)} · ${
    template.recurrenceData.recurrenceAmount ?? 0
  } times · creates ${template.recurrenceData.createDaysBefore ?? 0}d before`;
}

function upcomingFromTemplate(template: RecurrenceTemplate): Timestamp[] {
  if (isRecurrenceTemplateV2(template)) {
    const now = Date.now();
    return (template.recurrenceData.occurrences ?? [])
      .filter((occurrence) => !occurrence.eventId && occurrence.eventStart.toMillis() >= now)
      .sort((a, b) => a.eventStart.toMillis() - b.eventStart.toMillis())
      .slice(0, 2)
      .map((occurrence) => occurrence.eventStart);
  }
  return upcomingRecurrences(template.recurrenceData.allRecurrences ?? [], 2);
}

type RecurringHoverBodyProps = {
  template: RecurrenceTemplate;
};

/** Schedule settings + next two dates — the glance the row cadence line cannot hold. */
export function RecurringHoverBody({ template }: RecurringHoverBodyProps) {
  const upcoming = upcomingFromTemplate(template);
  const settings = scheduleSettings(template);

  return (
    <div className="space-y-2.5">
      <p className="text-foreground font-medium leading-snug">{settings}</p>
      <HoverList label="Next dates">
        {upcoming.length === 0 ? (
          <p className="text-foreground-secondary">No upcoming dates in this series.</p>
        ) : (
          upcoming.map((ts) => (
            <p key={ts.toMillis()} className="text-foreground font-medium tabular-nums">
              {timestampToEventCardDateString(ts)}
            </p>
          ))
        )}
      </HoverList>
    </div>
  );
}

export function RecurringHoverFlags({ template }: RecurringHoverBodyProps) {
  const ended = calculateRecurrenceEnded(template);
  const status = ended
    ? "Ended"
    : template.recurrenceData.recurrenceEnabled
      ? "Active"
      : "Paused";
  const flags = [status];
  if (template.eventData.isPrivate) flags.push("Private");
  if (template.eventData.formId) flags.push("Form attached");
  return <>{flags.join(" · ")}</>;
}
