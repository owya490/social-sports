import { EventMetadata } from "@/interfaces/EventTypes";

export function recalculateEventsMetadataTotalTicketCounts(eventMetadata: EventMetadata): EventMetadata {
  // Calculate total tickets for each purchaser
  for (const [emailHash, purchaserObj] of Object.entries(eventMetadata.purchaserMap)) {
    let totalPurchaserTickets = 0;
    for (const attendeeObj of Object.values(purchaserObj.attendees)) {
      totalPurchaserTickets += attendeeObj.ticketCount;
    }
    eventMetadata.purchaserMap[emailHash].totalTicketCount = totalPurchaserTickets;
  }

  // Calculate complete ticket count for the entire event
  let totalEventTickets = 0;
  for (const purchaserObj of Object.values(eventMetadata.purchaserMap)) {
    totalEventTickets += purchaserObj.totalTicketCount;
  }
  eventMetadata.completeTicketCount = totalEventTickets;

  return eventMetadata;
}
