"use client";

import { EventId, OrderId } from "@/interfaces/EventTypes";
import { UserId } from "@/interfaces/UserTypes";
import { AddAttendeeRequest } from "@/services/src/attendee/attendeeService";
import { useCallback, useSyncExternalStore } from "react";
import {
  addEventAttendee,
  approveEventOrder,
  getEventOrderAndTicketsSnapshot,
  getServerEventOrderAndTicketsSnapshot,
  refreshEventOrderAndTickets,
  rejectEventOrder,
  setEventAttendeeTickets,
  subscribeToEventOrderAndTickets,
} from "./eventOrderAndTicketsStore";

/**
 * Shared orders + tickets for one event. Calling this from multiple components
 * with the same event id reuses the in-memory fetch instead of hitting the db again.
 *
 * Order and ticket documents are written by backend functions; the update helpers
 * call those functions and then keep this shared state in sync.
 */
export function useEventOrderAndTickets(eventId: EventId | null | undefined) {
  const snapshot = useSyncExternalStore(
    (onStoreChange) => subscribeToEventOrderAndTickets(eventId, onStoreChange),
    () => getEventOrderAndTicketsSnapshot(eventId),
    getServerEventOrderAndTicketsSnapshot
  );

  const refresh = useCallback(async () => {
    if (!eventId) {
      return;
    }
    await refreshEventOrderAndTickets(eventId);
  }, [eventId]);

  const addAttendee = useCallback(
    async (request: Omit<AddAttendeeRequest, "eventId">) => {
      if (!eventId) {
        throw new Error("An event id is required to add an attendee");
      }
      return addEventAttendee(eventId, request);
    },
    [eventId]
  );

  const setAttendeeTickets = useCallback(
    async (request: { orderId: OrderId; numTickets: number; eventTicketTypeId: string }) => {
      if (!eventId) {
        throw new Error("An event id is required to update attendee tickets");
      }
      await setEventAttendeeTickets(eventId, request);
    },
    [eventId]
  );

  const approveOrder = useCallback(
    async (organiserId: UserId, orderId: OrderId) => {
      if (!eventId) {
        throw new Error("An event id is required to approve an order");
      }
      return approveEventOrder(eventId, organiserId, orderId);
    },
    [eventId]
  );

  const rejectOrder = useCallback(
    async (organiserId: UserId, orderId: OrderId) => {
      if (!eventId) {
        throw new Error("An event id is required to reject an order");
      }
      return rejectEventOrder(eventId, organiserId, orderId);
    },
    [eventId]
  );

  return {
    ...snapshot,
    refresh,
    addAttendee,
    setAttendeeTickets,
    approveOrder,
    rejectOrder,
  };
}
