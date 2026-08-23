import { EventTicketTypesMap } from "@/interfaces/EventTicketTypeTypes";
import { EventData, NewEventData } from "@/interfaces/EventTypes";
import {
  createEventTicketType,
  hasEventTicketTypes,
  syncEventAggregatesFromTicketTypes,
} from "./eventTicketTypesUtils";

export function duplicatedEventName(name: string): string {
  const trimmed = name.trim();
  return `Copy of ${trimmed || "event"}`;
}

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

/** Fields for createEvent: same listing details, new name, empty attendance, unsold inventory. */
export function buildDuplicatedNewEventData(event: EventData): NewEventData {
  const eventTicketTypes = cloneTicketTypesForDuplicate(event);
  const inventory = hasEventTicketTypes({ eventTicketTypes })
    ? syncEventAggregatesFromTicketTypes(eventTicketTypes as EventTicketTypesMap)
    : {
        price: event.price,
        capacity: event.capacity,
        vacancy: event.capacity,
      };

  return {
    startDate: event.startDate,
    endDate: event.endDate,
    location: event.location,
    locationLatLng: { ...event.locationLatLng },
    capacity: inventory.capacity,
    vacancy: inventory.vacancy,
    price: inventory.price,
    organiserId: event.organiserId,
    registrationDeadline: event.registrationDeadline,
    name: duplicatedEventName(event.name),
    description: event.description,
    image: event.image,
    thumbnail: event.thumbnail,
    eventTags: [...event.eventTags],
    isActive: true,
    isPrivate: event.isPrivate,
    attendees: {},
    attendeesMetadata: {},
    accessCount: 0,
    sport: event.sport,
    paymentsActive: event.paymentsActive,
    stripeFeeToCustomer: event.stripeFeeToCustomer,
    promotionalCodesEnabled: event.promotionalCodesEnabled,
    paused: event.paused,
    eventLink: event.eventLink,
    formId: event.formId,
    hideVacancy: event.hideVacancy,
    waitlistEnabled: event.waitlistEnabled,
    bookingApprovalEnabled: event.bookingApprovalEnabled,
    showAttendeesOnEventPage: event.showAttendeesOnEventPage,
    maxTicketsPerTransaction: event.maxTicketsPerTransaction,
    ...(eventTicketTypes ? { eventTicketTypes } : {}),
  };
}
