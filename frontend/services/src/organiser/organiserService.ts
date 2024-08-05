import { Attendee, EventId, Name, Purchaser } from "@/interfaces/EventTypes";
import { addEventAttendee, setAttendeeTickets } from "../events/eventsService";
import { Logger } from "@/observability/logger";

export const organiserServiceLogger = new Logger("organiserServiceLogger");

export async function addAttendee(
  email: string,
  name: Name,
  phoneNumber: string,
  numTickets: number,
  eventId: string
): Promise<void> {
  try {
    const attendeeInfo: Attendee = {
      phone: phoneNumber,
      ticketCount: numTickets,
    };
    const purchaserInfo: Purchaser = {
      email: email,
      attendees: {
        [name]: attendeeInfo,
      },
      totalTicketCount: numTickets,
    };
    await addEventAttendee(purchaserInfo, eventId);
  } catch (error) {
    organiserServiceLogger.error(
      `Error adding new attendee in addAttendee() from eventId: ${eventId} and attendee: ${email}, ${name}, ${phoneNumber}, ${numTickets}, ${eventId}`
    );
    organiserServiceLogger.error(JSON.stringify(error, null, 2));
    throw error;
  }
}

/**
 * Sets the specified attendee ticketCount to 0. Attendees with a ticket count of 0 are not shown in the organiser event drilldown.
 */
export async function removeAttendee(purchaser: Purchaser, attendeeName: Name, eventId: EventId) {
  try {
    await setAttendeeTickets(0, purchaser, attendeeName, eventId);
  } catch (error) {
    organiserServiceLogger.error(`removeAttendee error: ${error}`);
    throw error;
  }
}
