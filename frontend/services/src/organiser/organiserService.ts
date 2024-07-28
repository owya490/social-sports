import { Attendee, EventDataWithoutOrganiser, EventId, EventMetadata, Name, Purchaser } from "@/interfaces/EventTypes";
import { addEventAttendee, getPurchaserEmailHash } from "../events/eventsService";
import { findEventDoc } from "../events/eventsUtils/getEventsUtils";
import { runTransaction } from "firebase/firestore";
import { db } from "../firebase";
import { findEventMetadataDocRefByEventId } from "../events/eventsMetadata/eventsMetadataUtils/getEventsMetadataUtils";
import { findEventDocRef } from "../events/eventsUtils/commonEventsUtils";
import { Logger } from "@/observability/logger";

export const organiserServiceLogger = new Logger("organiserServiceLogger");

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
  await addEventAttendee(purchaserInfo, eventId);
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

export async function setAttendeeTickets(
  numTickets: number,
  purchaser: Purchaser,
  attendeeName: Name,
  eventId: EventId
) {
  const emailHash = getPurchaserEmailHash(purchaser.email);
  try {
    runTransaction(db, async (transaction) => {
      // Check that the update to the attendee tickets is within capacity of the event.
      const eventMetadataDocRef = findEventMetadataDocRefByEventId(eventId);
      const eventDataWithoutOrganiserDocRef = await findEventDocRef(eventId);
      let eventMetadata = (await transaction.get(eventMetadataDocRef)).data() as EventMetadata;
      let eventDataWithoutOrganiser = (
        await transaction.get(eventDataWithoutOrganiserDocRef)
      ).data() as EventDataWithoutOrganiser;

      const eventCapacity = eventDataWithoutOrganiser.capacity;
      const prevEventTotalTicketCount = eventMetadata.completeTicketCount;

      const prevAttendeeTicketCount = eventMetadata.purchaserMap[emailHash].attendees[attendeeName].ticketCount;
      const newEventTotalTicketCount = prevEventTotalTicketCount - prevAttendeeTicketCount + numTickets;

      if (newEventTotalTicketCount < 0 || newEventTotalTicketCount > eventCapacity) {
        organiserServiceLogger.error(
          `Setting ${attendeeName}'s tickets to ${numTickets} in event: ${eventId} causes the total ticket count to be ${newEventTotalTicketCount}, which is out of range [0, ${eventCapacity}]`
        );
        throw Error(
          `Setting ${attendeeName}'s tickets to ${numTickets} in event: ${eventId} causes the total ticket count to be ${newEventTotalTicketCount}, which is out of range [0, ${eventCapacity}]`
        );
      }

      // Update the values in both eventData and eventMetadata.
      eventMetadata.completeTicketCount = newEventTotalTicketCount;
      eventMetadata.purchaserMap[emailHash].attendees[attendeeName].ticketCount = numTickets;
      eventDataWithoutOrganiser.vacancy = eventCapacity - newEventTotalTicketCount;

      transaction.update(eventMetadataDocRef, eventMetadata as Partial<EventMetadata>);
      transaction.update(
        eventDataWithoutOrganiserDocRef,
        eventDataWithoutOrganiser as Partial<EventDataWithoutOrganiser>
      );
    });
  } catch (error) {
    organiserServiceLogger.error(`setAttendeeTickets error: ${error}`);
    throw error;
  }
}
