import { EventData, EventId } from "@/interfaces/EventTypes";
import { UserId } from "@/interfaces/UserTypes";
import { Timestamp } from "firebase/firestore";
import { getPrivateUserById } from "../users/usersService";
import { organiserHub } from "./organiserHubCache";
import { filterEventsStartingOnOrAfter } from "./organiserLookback";

async function getOrganiserEventIds(userId: UserId): Promise<EventId[]> {
  const privateDoc = await getPrivateUserById(userId);
  return (privateDoc.organiserEvents || []) as EventId[];
}

export async function getOrganiserEvents(userId: UserId, eventIds?: EventId[]): Promise<EventData[]> {
  if (!userId) {
    return [];
  }
  const ids = eventIds ?? (await getOrganiserEventIds(userId));
  return organiserHub.getEvents(ids);
}

export async function getOrganiserEventsStartingOnOrAfter(
  userId: UserId,
  startDateOnOrAfter: Timestamp
): Promise<{ events: EventData[]; hasAnyOrganiserEvents: boolean }> {
  const eventIds = await getOrganiserEventIds(userId);
  const events = await organiserHub.getEvents(eventIds);
  return {
    events: filterEventsStartingOnOrAfter(events, startDateOnOrAfter),
    hasAnyOrganiserEvents: events.length > 0,
  };
}
