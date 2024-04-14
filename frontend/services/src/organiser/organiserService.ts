import { findEventDoc } from "../events/eventsUtils/getEventsUtils";

export async function getEventAttendees(eventId: string) {
  const eventDoc = await findEventDoc(eventId);
}
