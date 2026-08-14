import { EventId } from "@/interfaces/EventTypes";
import { EventTicketTypeId, EventTicketTypesMap } from "@/interfaces/EventTicketTypeTypes";
import {
  getSortedEventTicketTypes,
  hasEventTicketTypes,
  SortedEventTicketType,
} from "@/services/src/events/eventsUtils/eventTicketTypesUtils";
import { getBuyerTicketCountOptionsWithStoredSessions } from "@/services/src/events/eventsUtils/ticketLimits";
import { getStoredFulfilmentSessionId } from "@/services/src/fulfilment/fulfilmentUtils/fulfilmentUtils";
import { useMemo, useState } from "react";

function pickDefaultTicketTypeId(
  usesTicketTypes: boolean,
  activeTypes: SortedEventTicketType[]
): EventTicketTypeId | null {
  if (!usesTicketTypes || activeTypes.length === 0) {
    return null;
  }
  return (activeTypes.find((t) => t.eventTicketType.vacancy > 0) ?? activeTypes[0]).eventTicketTypeId;
}

export function useEventTicketTypeCheckout(params: {
  eventId: EventId;
  eventTicketTypes?: EventTicketTypesMap;
  vacancy: number;
  price: number;
  maxTicketsPerTransaction?: number;
}) {
  const usesTicketTypes = hasEventTicketTypes({ eventTicketTypes: params.eventTicketTypes });
  const activeTypes = useMemo(
    () => getSortedEventTicketTypes(params.eventTicketTypes),
    [params.eventTicketTypes]
  );
  const showTypeSelector = usesTicketTypes && activeTypes.length > 1;

  const [selectedTypeId, setSelectedTypeId] = useState<EventTicketTypeId | null>(() =>
    pickDefaultTicketTypeId(usesTicketTypes, activeTypes)
  );
  const resolvedTypeId =
    selectedTypeId !== null && activeTypes.some((type) => type.eventTicketTypeId === selectedTypeId)
      ? selectedTypeId
      : pickDefaultTicketTypeId(usesTicketTypes, activeTypes);

  const selectedType = useMemo(
    () => activeTypes.find((t) => t.eventTicketTypeId === resolvedTypeId),
    [activeTypes, resolvedTypeId]
  );

  const effectiveVacancy = usesTicketTypes ? (selectedType?.eventTicketType.vacancy ?? 0) : params.vacancy;
  const effectivePrice = usesTicketTypes ? (selectedType?.eventTicketType.price ?? params.price) : params.price;
  const effectiveEventTicketTypeId: EventTicketTypeId | null = usesTicketTypes ? resolvedTypeId : null;

  const allCounts = useMemo(
    () =>
      getBuyerTicketCountOptionsWithStoredSessions(
        effectiveVacancy,
        params.maxTicketsPerTransaction,
        (ticketCount) =>
          effectiveEventTicketTypeId !== null &&
          getStoredFulfilmentSessionId(params.eventId, ticketCount, effectiveEventTicketTypeId) !== null
      ),
    [effectiveVacancy, params.maxTicketsPerTransaction, params.eventId, effectiveEventTicketTypeId]
  );

  const [attendeeCount, setAttendeeCount] = useState<number>(1);
  const resolvedAttendeeCount =
    allCounts.length === 0 || allCounts.includes(attendeeCount) ? attendeeCount : allCounts[0];

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
    selectedTypeId: resolvedTypeId,
    setSelectedTypeId,
    handleTicketTypeChange,
    selectedType,
    effectiveVacancy,
    effectivePrice,
    effectiveEventTicketTypeId,
    allCounts,
    attendeeCount: resolvedAttendeeCount,
    setAttendeeCount,
    typeSoldOut,
  };
}

export type EventTicketTypeCheckout = ReturnType<typeof useEventTicketTypeCheckout>;
