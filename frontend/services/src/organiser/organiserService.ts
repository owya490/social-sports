import { findEventDoc } from "../events/eventsUtils/getEventsUtils";

export async function getEventAttendees(eventId: string) {
  const eventDoc = await findEventDoc(eventId);
}

export async function inviteAttendee(email: string) {
  // this is a stub function
}

export async function removeAttendee(email: string) {
  // this is a stub function
}
