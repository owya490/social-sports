import { Attendee, Name, Purchaser } from "@/interfaces/EventTypes";
import { addEventAttendee } from "../events/eventsService";
import { findEventDoc } from "../events/eventsUtils/getEventsUtils";

export async function getEventAttendees(eventId: string) {
  const eventDoc = await findEventDoc(eventId);
}

export async function addAttendee(email: string, name: Name, phoneNumber: string, numTickets: number, eventId: string) {
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
  addEventAttendee(purchaserInfo, eventId);
}

export async function removeAttendee(email: string) {
  // this is a stub function
}
