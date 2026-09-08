"use client";

import { EventData, EventId, EventMetadata, OrderId, TicketId } from "@/interfaces/EventTypes";
import { Order } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import {
  clearOrganiserHubCache,
  getOrganiserHubCacheSnapshot,
  getOrganiserHubEvent,
  getOrganiserHubEventMetadata,
  getOrganiserHubEventMetadataByIds,
  getOrganiserHubEvents,
  getOrganiserHubOrder,
  getOrganiserHubOrders,
  getOrganiserHubTicket,
  getOrganiserHubTickets,
  invalidateOrganiserHubEvent,
  invalidateOrganiserHubEventMetadata,
  invalidateOrganiserHubEventMetadataMany,
  invalidateOrganiserHubEvents,
  invalidateOrganiserHubOrder,
  invalidateOrganiserHubOrders,
  invalidateOrganiserHubTicket,
  invalidateOrganiserHubTickets,
  onOrganiserHubCacheChange,
  type OrganiserHubCacheSnapshot,
} from "@/services/src/organiser/organiserHubCache";
import { useEffect, useState } from "react";

export type UseEventsForOrganiserHubResult = OrganiserHubCacheSnapshot & {
  getEvent: (eventId: EventId) => Promise<EventData>;
  getEvents: (eventIds: EventId[]) => Promise<EventData[]>;
  getEventMetadata: (eventId: EventId) => Promise<EventMetadata>;
  getEventMetadataByIds: (eventIds: EventId[]) => Promise<EventMetadata[]>;
  getTicket: (ticketId: TicketId) => Promise<Ticket>;
  getTickets: (ticketIds: TicketId[]) => Promise<Ticket[]>;
  getOrder: (orderId: OrderId) => Promise<Order>;
  getOrders: (orderIds: OrderId[]) => Promise<Order[]>;
  invalidateEvent: (eventId: EventId) => void;
  invalidateEvents: (eventIds: EventId[]) => void;
  invalidateEventMetadata: (eventId: EventId) => void;
  invalidateEventMetadataMany: (eventIds: EventId[]) => void;
  invalidateTicket: (ticketId: TicketId) => void;
  invalidateTickets: (ticketIds: TicketId[]) => void;
  invalidateOrder: (orderId: OrderId) => void;
  invalidateOrders: (orderIds: OrderId[]) => void;
  clear: () => void;
};

/**
 * Read-through holder for organiser hub documents.
 * Caches are keyed like the DB (event, metadata, ticket, order ids) with no join index.
 * Mutations should invalidate the changed ids; the next get fetches fresh.
 */
export function useEventsForOrganiserHub(): UseEventsForOrganiserHubResult {
  const [, setRevision] = useState(0);

  useEffect(() => onOrganiserHubCacheChange(() => setRevision((current) => current + 1)), []);

  const snapshot = getOrganiserHubCacheSnapshot();

  return {
    ...snapshot,
    getEvent: getOrganiserHubEvent,
    getEvents: getOrganiserHubEvents,
    getEventMetadata: getOrganiserHubEventMetadata,
    getEventMetadataByIds: getOrganiserHubEventMetadataByIds,
    getTicket: getOrganiserHubTicket,
    getTickets: getOrganiserHubTickets,
    getOrder: getOrganiserHubOrder,
    getOrders: getOrganiserHubOrders,
    invalidateEvent: invalidateOrganiserHubEvent,
    invalidateEvents: invalidateOrganiserHubEvents,
    invalidateEventMetadata: invalidateOrganiserHubEventMetadata,
    invalidateEventMetadataMany: invalidateOrganiserHubEventMetadataMany,
    invalidateTicket: invalidateOrganiserHubTicket,
    invalidateTickets: invalidateOrganiserHubTickets,
    invalidateOrder: invalidateOrganiserHubOrder,
    invalidateOrders: invalidateOrganiserHubOrders,
    clear: clearOrganiserHubCache,
  };
}
