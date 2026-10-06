import { EventData, EventDataWithoutOrganiser } from "@/interfaces/EventTypes";
import { Timestamp } from "firebase/firestore";
import { hasEventEndPassed } from "../../datetimeUtils";
import { CollectionPaths, EventStatus } from "../eventsConstants";

const DATE_FIELDS = ["startDate", "endDate", "registrationDeadline"] as const;

export class EventDateUpdateError extends Error {}

export function hasEventDateUpdates(updates: Partial<EventData>): boolean {
  return DATE_FIELDS.some((field) => Object.hasOwn(updates, field));
}

export function validateEventDateUpdates(
  current: EventDataWithoutOrganiser,
  updates: Partial<EventData>,
  collectionPath: string,
  now: Timestamp
): void {
  const datesChanged = DATE_FIELDS.some((field) => {
    if (!Object.hasOwn(updates, field)) return false;
    const proposed = updates[field];
    const previous = current[field];
    return !(proposed instanceof Timestamp) || !(previous instanceof Timestamp) || !proposed.isEqual(previous);
  });
  if (!datesChanged) return;

  if (!collectionPath.startsWith(`${CollectionPaths.Events}/${EventStatus.Active}/`) || current.isActive !== true) {
    throw new EventDateUpdateError("This event is inactive. Its dates cannot be changed.");
  }
  if (!(current.endDate instanceof Timestamp) || hasEventEndPassed(current.endDate, now)) {
    throw new EventDateUpdateError("This event has ended. Its dates cannot be changed.");
  }
  for (const field of ["isActive", "isPrivate", "organiserId"] as const) {
    if (Object.hasOwn(updates, field) && updates[field] !== current[field]) {
      throw new EventDateUpdateError("Changing event dates cannot change its owner or status.");
    }
  }

  const { startDate, endDate, registrationDeadline } = { ...current, ...updates };
  if (
    !(startDate instanceof Timestamp) ||
    !(endDate instanceof Timestamp) ||
    !(registrationDeadline instanceof Timestamp)
  ) {
    throw new EventDateUpdateError("Event dates must be valid timestamps.");
  }
  if (
    hasEventEndPassed(endDate, now) ||
    startDate.toMillis() > endDate.toMillis() ||
    registrationDeadline.toMillis() > endDate.toMillis()
  ) {
    throw new EventDateUpdateError("Event end must be in the future and after its start and registration deadline.");
  }
}
