import { EventId } from "@/interfaces/EventTypes";
import { FeaturedEventReference } from "@/interfaces/UserTypes";

export type FeaturedEventChoice = {
  eventId: string;
  name: string;
};

/** Dropdown options: the organiser's events, plus a saved reference that is no longer in that list. */
export function featuredEventChoices(
  events: FeaturedEventChoice[],
  current: FeaturedEventReference | null | undefined
): FeaturedEventChoice[] {
  const byId = new Map<string, FeaturedEventChoice>();
  for (const event of events) {
    if (!event.eventId) continue;
    byId.set(event.eventId, { eventId: event.eventId, name: event.name || "Untitled event" });
  }
  if (current?.eventId && !byId.has(current.eventId)) {
    byId.set(current.eventId, {
      eventId: current.eventId,
      name: current.name?.trim() || "Featured event",
    });
  }
  return [...byId.values()].sort(
    (a, b) => a.name.localeCompare(b.name) || a.eventId.localeCompare(b.eventId)
  );
}

/** Null when no event is selected. */
export function featuredEventFromSelection(
  eventId: string,
  events: FeaturedEventChoice[],
  current: FeaturedEventReference | null | undefined
): FeaturedEventReference | null {
  const id = eventId.trim();
  if (!id) return null;
  const fromList = events.find((event) => event.eventId === id)?.name.trim() ?? "";
  const fromCurrent = current?.eventId === id ? current.name.trim() : "";
  const name = fromList || fromCurrent;
  if (!name) return null;
  return { eventId: id as EventId, name };
}
