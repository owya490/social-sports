import type { EventData } from "@/interfaces/EventTypes";
import type { Timestamp } from "firebase/firestore";

export type EventDetailsDraft = Pick<
  EventData,
  "name" | "description" | "location" | "sport" | "eventLink" | "startDate" | "endDate" | "registrationDeadline"
>;

function sameMinute(a: Timestamp, b: Timestamp) {
  return Math.floor(a.toMillis() / 60000) === Math.floor(b.toMillis() / 60000);
}

export function getEventDetailsChanges(initial: EventDetailsDraft, draft: EventDetailsDraft): Partial<EventData> {
  const changes: Partial<EventData> = {};
  if (draft.name !== initial.name) {
    changes.name = draft.name.trim();
    changes.nameTokens = changes.name.toLowerCase().split(" ");
  }
  if (draft.description !== initial.description) changes.description = draft.description;
  if (draft.location !== initial.location) {
    changes.location = draft.location;
    changes.locationTokens = draft.location.toLowerCase().split(" ");
  }
  if (draft.sport !== initial.sport) changes.sport = draft.sport;
  if (draft.eventLink !== initial.eventLink) changes.eventLink = draft.eventLink;
  // The schedule inputs expose minutes; untouched seconds must survive a details save.
  if (!sameMinute(draft.startDate, initial.startDate)) changes.startDate = draft.startDate;
  if (!sameMinute(draft.endDate, initial.endDate)) changes.endDate = draft.endDate;
  if (!sameMinute(draft.registrationDeadline, initial.registrationDeadline)) {
    changes.registrationDeadline = draft.registrationDeadline;
  }
  return changes;
}
