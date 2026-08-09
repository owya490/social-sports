import { EventId } from "@/interfaces/EventTypes";
import { EventTicketTypeId, EventTicketTypesMap } from "@/interfaces/EventTicketTypeTypes";
import {
  getSortedEventTicketTypes,
  hasEventTicketTypes,
  resolveCheckoutTicketTypeId,
} from "@/services/src/events/eventsUtils/eventTicketTypesUtils";
import { getBuyerTicketCountOptionsWithStoredSessions } from "@/services/src/events/eventsUtils/ticketLimits";
import { getStoredFulfilmentSessionId } from "@/services/src/fulfilment/fulfilmentUtils/fulfilmentUtils";
import { useEffect, useMemo, useState } from "react";

export function useEventTicketTypeCheckout(params: {
  eventId: EventId;
  eventTicketTypes?: EventTicketTypesMap;
  vacancy: number;
  price: number;
  maxTicketsPerTransaction?: number;
  /** Fallback type id when the event has a single known type (e.g. General Admission). */
  fallbackEventTicketTypeId: EventTicketTypeId;
}) {
  const usesTicketTypes = hasEventTicketTypes({ eventTicketTypes: params.eventTicketTypes });
  const activeTypes = useMemo(
    () => getSortedEventTicketTypes(params.eventTicketTypes),
    [params.eventTicketTypes]
  );
  const showTypeSelector = usesTicketTypes && activeTypes.length > 1;

  const [selectedTypeId, setSelectedTypeId] = useState<EventTicketTypeId | null>(null);

  useEffect(() => {
    if (!usesTicketTypes || activeTypes.length === 0) {
      setSelectedTypeId(null);
      return;
    }
    const firstAvailable = activeTypes.find((t) => t.eventTicketType.vacancy > 0) ?? activeTypes[0];
    setSelectedTypeId(firstAvailable.eventTicketTypeId);
  }, [usesTicketTypes, activeTypes]);

  const selectedType = useMemo(
    () => activeTypes.find((t) => t.eventTicketTypeId === selectedTypeId),
    [activeTypes, selectedTypeId]
  );

  const effectiveVacancy = usesTicketTypes ? (selectedType?.eventTicketType.vacancy ?? 0) : params.vacancy;
  const effectivePrice = usesTicketTypes ? (selectedType?.eventTicketType.price ?? params.price) : params.price;
  const effectiveEventTicketTypeId: EventTicketTypeId = usesTicketTypes
    ? (selectedTypeId ?? params.fallbackEventTicketTypeId)
    : params.fallbackEventTicketTypeId;

  const allCounts = useMemo(
    () =>
      getBuyerTicketCountOptionsWithStoredSessions(
        effectiveVacancy,
        params.maxTicketsPerTransaction,
        (ticketCount) =>
          getStoredFulfilmentSessionId(params.eventId, ticketCount, effectiveEventTicketTypeId) !== null
      ),
    [effectiveVacancy, params.maxTicketsPerTransaction, params.eventId, effectiveEventTicketTypeId]
  );

  const [attendeeCount, setAttendeeCount] = useState<number>(1);

  useEffect(() => {
    setAttendeeCount(allCounts[0] ?? 1);
  }, [allCounts.join(",")]);

  const handleTicketTypeChange = (value?: string) => {
    if (value) {
      setSelectedTypeId(value as EventTicketTypeId);
    }
  };

  const typeSoldOut = effectiveVacancy === 0 && allCounts.length === 0;

  return {
    usesTicketTypes,
    showTypeSelector,
    activeTypes,
    selectedTypeId,
    setSelectedTypeId,
    handleTicketTypeChange,
    selectedType,
    effectiveVacancy,
    effectivePrice,
    effectiveEventTicketTypeId,
    allCounts,
    attendeeCount,
    setAttendeeCount,
    typeSoldOut,
  };
}

export type EventTicketTypeCheckout = ReturnType<typeof useEventTicketTypeCheckout>;

export function resolveFallbackTicketTypeId(event: {
  eventTicketTypes?: EventTicketTypesMap;
  price?: number;
  capacity?: number;
  vacancy?: number;
}): EventTicketTypeId {
  return resolveCheckoutTicketTypeId(event);
}
