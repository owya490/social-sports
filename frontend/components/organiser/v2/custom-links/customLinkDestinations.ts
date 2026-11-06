import { splitEventsByTime } from "@/components/organiser/v2/dashboard/computeDashboardStats";
import { EventData } from "@/interfaces/EventTypes";
import { RecurrenceTemplate } from "@/interfaces/RecurringEventTypes";
import { timestampToEventCardDateString } from "@/services/src/datetimeUtils";

/** Events the organiser can still attach. Archived events (inactive and already ended) are omitted. */
export function eventsAvailableForCustomLinks(events: EventData[], nowSeconds = Math.floor(Date.now() / 1000)): EventData[] {
  const byId = new Map<string, EventData>();
  for (const event of events) {
    if (!event.eventId) continue;
    const endSeconds = event.endDate?.seconds ?? 0;
    const stillListed = event.isActive !== false || endSeconds > nowSeconds;
    if (!stillListed) continue;
    byId.set(event.eventId, event);
  }

  const { upcoming, past } = splitEventsByTime([...byId.values()], nowSeconds);
  return [...upcoming, ...past];
}

/** Active series an organiser can attach. Turned-off series are omitted. */
export function seriesAvailableForCustomLinks(templates: RecurrenceTemplate[]): RecurrenceTemplate[] {
  return templates.filter(
    (template) => Boolean(template.recurrenceTemplateId) && template.recurrenceData.recurrenceEnabled,
  );
}

export function customLinkEventOptionName(event: EventData): string {
  const when = timestampToEventCardDateString(event.startDate);
  return event.isPrivate ? `${event.name} · ${when} · Private` : `${event.name} · ${when}`;
}
