import { EmptyEventData, EventData, EventId } from "@/interfaces/EventTypes";
import { EMPTY_RECURRENCE_TEMPLATE, RecurrenceTemplate, RecurrenceTemplateId } from "@/interfaces/RecurringEventTypes";
import { Timestamp } from "firebase/firestore";
import { eventsAvailableForCustomLinks, seriesAvailableForCustomLinks } from "./customLinkDestinations";

function event(eventId: string, name: string, startSeconds: number, endSeconds: number, isPrivate: boolean, isActive: boolean): EventData {
  return {
    ...EmptyEventData,
    eventId: eventId as EventId,
    name,
    startDate: new Timestamp(startSeconds, 0),
    endDate: new Timestamp(endSeconds, 0),
    isPrivate,
    isActive,
  };
}

function series(id: string, name: string, recurrenceEnabled: boolean): RecurrenceTemplate {
  return {
    ...EMPTY_RECURRENCE_TEMPLATE,
    recurrenceTemplateId: id as RecurrenceTemplateId,
    eventData: { ...EMPTY_RECURRENCE_TEMPLATE.eventData, name },
    recurrenceData: { ...EMPTY_RECURRENCE_TEMPLATE.recurrenceData, recurrenceEnabled },
  };
}

describe("events available to attach to a custom link", () => {
  const now = 1_700_000_000;

  it("includes private and public events the organiser still owns, and drops archived ones", () => {
    const privateUpcoming = event("private", "Private social", now + 3_600, now + 7_200, true, true);
    const publicUpcoming = event("public", "Public social", now + 86_400, now + 90_000, false, true);
    const inProgress = event("live", "Live social", now - 600, now + 3_600, false, true);
    const archived = event("archived", "Old social", now - 86_400, now - 80_000, false, false);

    const result = eventsAvailableForCustomLinks(
      [archived, publicUpcoming, privateUpcoming, inProgress],
      now,
    );

    expect(result.map((item) => item.eventId)).toEqual(["private", "public", "live"]);
  });
});

describe("series available to attach to a custom link", () => {
  it("includes every active series and drops series that are turned off", () => {
    const active = series("weekly", "Weekly tennis", true);
    const paused = series("paused", "Paused tennis", false);

    expect(seriesAvailableForCustomLinks([paused, active]).map((item) => item.recurrenceTemplateId)).toEqual([
      "weekly",
    ]);
  });
});
