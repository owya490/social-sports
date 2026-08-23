import { EventTicketTypesMap } from "@/interfaces/EventTicketTypeTypes";
import { EventData, NewEventData } from "@/interfaces/EventTypes";
import {
  createEventTicketType,
  hasEventTicketTypes,
  syncEventAggregatesFromTicketTypes,
} from "./eventTicketTypesUtils";

function cloneTicketTypesForDuplicate(event: EventData): EventTicketTypesMap | undefined {
  if (!hasEventTicketTypes(event) || event.eventTicketTypes == null) {
    return event.eventTicketTypes;
  }
  const cloned: EventTicketTypesMap = {};
  for (const ticketType of Object.values(event.eventTicketTypes)) {
    if (!ticketType) continue;
    const next = createEventTicketType({
      name: ticketType.name,
      price: ticketType.price,
      capacity: ticketType.capacity,
      vacancy: ticketType.capacity,
      formId: ticketType.formId ?? null,
    });
    cloned[next.id] = next;
  }
  return cloned;
}

/** Same listing details for createEvent, with a new name, empty attendance, and unsold inventory. */
export function buildDuplicatedNewEventData(event: EventData): NewEventData {
  const {
    eventId: _eventId,
    organiser: _organiser,
    nameTokens: _nameTokens,
    locationTokens: _locationTokens,
    ...rest
  } = event;
  const eventTicketTypes = cloneTicketTypesForDuplicate(event);
  const inventory = hasEventTicketTypes({ eventTicketTypes })
    ? syncEventAggregatesFromTicketTypes(eventTicketTypes as EventTicketTypesMap)
    : { price: event.price, capacity: event.capacity, vacancy: event.capacity };

  return {
    ...rest,
    name: `Copy of ${event.name.trim() || "event"}`,
    attendees: {},
    attendeesMetadata: {},
    accessCount: 0,
    isActive: true,
    eventTags: [...event.eventTags],
    locationLatLng: { ...event.locationLatLng },
    ...inventory,
    ...(eventTicketTypes ? { eventTicketTypes } : {}),
  };
}
