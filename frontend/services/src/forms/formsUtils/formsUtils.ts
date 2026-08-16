// TODO: functions to abstract away editing forms

import { EventTicketTypeId } from "@/interfaces/EventTicketTypeTypes";
import { EventId } from "@/interfaces/EventTypes";
import { FormId, FormResponse, FormResponseId, FormSection, FormSectionType, SectionId } from "@/interfaces/FormTypes";
import { Order } from "@/interfaces/OrderTypes";
import { OrderAndTicketStatus } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { doc, DocumentData, DocumentReference, getDoc, QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import {
  GENERAL_TICKET_TYPE_NAME,
  getAttachedFormIdsForEvent,
  resolveFormIdForTicketType,
} from "../../events/eventsUtils/eventTicketTypesUtils";
import { FormResponsePaths, FormTemplatePaths } from "../formsConstants";
import { formsServiceLogger } from "../formsServices";

type EventFormLookupSource = {
  formId?: FormId | null;
  eventTicketTypes?: Parameters<typeof resolveFormIdForTicketType>[0]["eventTicketTypes"];
};

/** Ticket belongs to the selected event ticket type (GA catch-all matches Forms filtering). */
export function ticketMatchesEventTicketType(
  ticket: Ticket,
  eventTicketTypeId: EventTicketTypeId,
  ticketTypeName?: string | null
): boolean {
  if (ticket.eventTicketTypeId === eventTicketTypeId) {
    return true;
  }
  if (ticketTypeName !== GENERAL_TICKET_TYPE_NAME) {
    return false;
  }
  return !ticket.eventTicketTypeId || ticket.eventTicketTypeName === GENERAL_TICKET_TYPE_NAME;
}

/**
 * Orders that include at least one ticket of the selected type.
 * Keeps the full ticket list for each matching order (approve/reject still needs the whole order).
 */
export function filterOrderTicketsMapByTicketType(
  orderTicketsMap: Map<Order, Ticket[]>,
  eventTicketTypeId: EventTicketTypeId,
  ticketTypeName?: string | null
): Map<Order, Ticket[]> {
  const filtered = new Map<Order, Ticket[]>();
  orderTicketsMap.forEach((tickets, order) => {
    if (tickets.some((ticket) => ticketMatchesEventTicketType(ticket, eventTicketTypeId, ticketTypeName))) {
      filtered.set(order, tickets);
    }
  });
  return filtered;
}

export type AttendeeFormResponseLookup = {
  formResponseId: FormResponseId;
  formId: FormId;
  eventTicketTypeId: EventTicketTypeId | null;
  eventTicketTypeName?: string;
};

/**
 * Map each ticket (and legacy purchaserMap) form response to a preferred formId hint.
 * Prefer per-ticket-type resolution; if unknown, fall back to any form attached to the event
 * so the fetch layer can still locate Temp/Submitted answers.
 */
export function collectAttendeeFormResponseLookups(
  event: EventFormLookupSource,
  tickets: Ticket[],
  legacyFormResponseIds: Iterable<FormResponseId | string> = []
): AttendeeFormResponseLookup[] {
  const lookups: AttendeeFormResponseLookup[] = [];
  const seen = new Set<FormResponseId>();
  const attachedFormIds = getAttachedFormIdsForEvent(event);
  const fallbackFormId = attachedFormIds[0] ?? null;

  for (const ticket of tickets) {
    if (!ticket.formResponseId || seen.has(ticket.formResponseId)) {
      continue;
    }
    const formId = resolveFormIdForTicketType(event, ticket.eventTicketTypeId) ?? fallbackFormId;
    if (!formId) {
      continue;
    }
    seen.add(ticket.formResponseId);
    lookups.push({
      formResponseId: ticket.formResponseId,
      formId,
      eventTicketTypeId: ticket.eventTicketTypeId ?? null,
      eventTicketTypeName: ticket.eventTicketTypeName,
    });
  }

  for (const rawId of legacyFormResponseIds) {
    const formResponseId = rawId as FormResponseId;
    if (!fallbackFormId || seen.has(formResponseId)) {
      continue;
    }
    seen.add(formResponseId);
    lookups.push({
      formResponseId,
      formId: fallbackFormId,
      eventTicketTypeId: null,
    });
  }

  return lookups;
}

export function filterAttendeeFormResponseLookupsByTicketType(
  lookups: AttendeeFormResponseLookup[],
  eventTicketTypeId: EventTicketTypeId,
  ticketTypeName?: string | null
): AttendeeFormResponseLookup[] {
  const includeCatchAll = ticketTypeName === GENERAL_TICKET_TYPE_NAME;
  return lookups.filter((lookup) => {
    if (lookup.eventTicketTypeId === eventTicketTypeId) {
      return true;
    }
    if (!includeCatchAll) {
      return false;
    }
    // Legacy responses with no ticket type surface under General Admission.
    return !lookup.eventTicketTypeId || lookup.eventTicketTypeName === GENERAL_TICKET_TYPE_NAME;
  });
}

/** Find form doc from within the sub collections in the Forms table */
export async function findFormDocRef(formId: FormId): Promise<DocumentReference<DocumentData, DocumentData>> {
  try {
    // Search through paths
    for (const path of Object.values(FormTemplatePaths)) {
      // Attempt to retrieve the document from current subcollection
      const formDocRef = doc(db, path, formId);
      const formDoc = await getDoc(formDocRef);
      if (formDoc.exists()) {
        formsServiceLogger.info(`Found form document reference for formId: ${formId}, form: ${formDoc}`);
        return formDocRef;
      }
    }

    // If no document found, log and throw an error
    formsServiceLogger.error(`Form document reference not found in any subcollection for formId: ${formId}`);
    throw new Error(`No form document reference found in any subcollection with formId: ${formId}`);
  } catch (error) {
    formsServiceLogger.error(`findFormDoc: Failed to find form doc reference: ${error}`);
    throw error;
  }
}

export async function findFormDoc(formId: FormId): Promise<QueryDocumentSnapshot<DocumentData, DocumentData>> {
  try {
    const formDocRef = await findFormDocRef(formId);
    const formDoc = await getDoc(formDocRef);

    if (formDoc.exists()) {
      formsServiceLogger.info(`Found form document for formId: ${formId}, form: ${formId}`);
      return formDoc;
    }
    throw new Error(`No form document found in any subcollection with formId: ${formId}`);
  } catch (error) {
    formsServiceLogger.error(`findFormDoc: Failed to find form doc: ${error}`);
    throw error;
  }
}

export async function findFormResponseDocRef(
  formId: FormId,
  eventId: EventId,
  formResponseId: FormResponseId
): Promise<DocumentReference<DocumentData, DocumentData>> {
  try {
    // Search through paths
    for (const path of Object.values(FormResponsePaths)) {
      const formResponseDocRef = doc(db, path, formId, eventId, formResponseId);
      const formDoc = await getDoc(formResponseDocRef);

      if (formDoc.exists()) {
        formsServiceLogger.info(
          `findFormResponseDocRef: Found form response document reference for formResponseId: ${formResponseId}, formId: ${formId}, eventId: ${eventId}`
        );
        return formResponseDocRef;
      }
    }

    formsServiceLogger.error(
      `findFormResponseDocRef: Form response document reference not found in any subcollection for formResponseId: ${formResponseId}, formId: ${formId}, eventId: ${eventId}`
    );
    throw new Error(
      `findFormResponseDocRef: No form response document reference found in any subcollection with formResponseId: ${formResponseId}, formId: ${formId}, eventId: ${eventId}`
    );
  } catch (error) {
    formsServiceLogger.error(`findFormResponseDocRef: Failed to find form response doc reference: ${error}`);
    throw error;
  }
}

export async function findFormResponseDoc(
  formId: FormId,
  eventId: EventId,
  formResponseId: FormResponseId
): Promise<QueryDocumentSnapshot<DocumentData, DocumentData>> {
  try {
    const formResponseDocRef = await findFormResponseDocRef(formId, eventId, formResponseId);
    const formResponseDoc = await getDoc(formResponseDocRef);
    if (formResponseDoc.exists()) {
      formsServiceLogger.info(
        `findFormResponseDoc: Found form response document for formResponseId: ${formResponseId}, formId: ${formId}, eventId: ${eventId}`
      );
      return formResponseDoc;
    }

    formsServiceLogger.error(
      `findFormResponseDoc: Form response document not found in any subcollection for formResponseId: ${formResponseId}, formId: ${formId}, eventId: ${eventId}`
    );
    throw new Error("findFormResponseDoc: Form response not found.");
  } catch (error) {
    formsServiceLogger.error(`findFormResponseDoc: Failed to find form response doc: ${error}`);
    throw error;
  }
}
export function archiveSection(sectionId: SectionId): void {
  // TODO
}

/** Orders and tickets with APPROVED status only (matches attendee approved tab). */
export function getApprovedOrderTicketsMap(orderTicketsMap: Map<Order, Ticket[]>): Map<Order, Ticket[]> {
  const approvedMap = new Map<Order, Ticket[]>();
  orderTicketsMap.forEach((tickets, order) => {
    if (order.status !== OrderAndTicketStatus.APPROVED) {
      return;
    }
    const approvedTickets = tickets.filter((ticket) => ticket.status === OrderAndTicketStatus.APPROVED);
    if (approvedTickets.length > 0) {
      approvedMap.set(order, approvedTickets);
    }
  });
  return approvedMap;
}

export function getFormResponseIdsFromOrderTicketsMap(orderTicketsMap: Map<Order, Ticket[]>): Set<FormResponseId> {
  const formResponseIds = new Set<FormResponseId>();
  orderTicketsMap.forEach((tickets) => {
    tickets.forEach((ticket) => {
      if (ticket.formResponseId) {
        formResponseIds.add(ticket.formResponseId);
      }
    });
  });
  return formResponseIds;
}

/**
 * Approved-ticket responses, plus responses not linked to any ticket in the map
 * (manual organiser submissions / legacy attendee answers). Pending/rejected
 * ticket-linked responses stay hidden.
 */
export function filterFormResponsesForApprovedOrders(
  formResponses: FormResponse[],
  orderTicketsMap: Map<Order, Ticket[]>
): FormResponse[] {
  const approvedFormResponseIds = getFormResponseIdsFromOrderTicketsMap(
    getApprovedOrderTicketsMap(orderTicketsMap)
  );
  const allLinkedFormResponseIds = getFormResponseIdsFromOrderTicketsMap(orderTicketsMap);
  return formResponses.filter((response) => {
    const id = response.formResponseId;
    return approvedFormResponseIds.has(id) || !allLinkedFormResponseIds.has(id);
  });
}

/**
 * Form responses linked to approved tickets for a specific event ticket type.
 * General Admission is a catch-all for:
 * - legacy tickets with no eventTicketTypeId
 * - tickets still named General Admission (stale type id after remigration)
 * - responses not linked to any ticket (manual / legacy attendee answers)
 */
export function filterFormResponsesForTicketType(
  formResponses: FormResponse[],
  orderTicketsMap: Map<Order, Ticket[]>,
  eventTicketTypeId: EventTicketTypeId,
  ticketTypeName?: string | null
): FormResponse[] {
  const approvedMap = getApprovedOrderTicketsMap(orderTicketsMap);
  const typeFormResponseIds = new Set<FormResponseId>();
  const includeCatchAll = ticketTypeName === GENERAL_TICKET_TYPE_NAME;
  const allLinkedFormResponseIds = includeCatchAll
    ? getFormResponseIdsFromOrderTicketsMap(orderTicketsMap)
    : null;

  approvedMap.forEach((tickets) => {
    tickets.forEach((ticket) => {
      if (!ticket.formResponseId) {
        return;
      }
      if (ticket.eventTicketTypeId === eventTicketTypeId) {
        typeFormResponseIds.add(ticket.formResponseId);
        return;
      }
      if (!includeCatchAll) {
        return;
      }
      if (!ticket.eventTicketTypeId || ticket.eventTicketTypeName === GENERAL_TICKET_TYPE_NAME) {
        typeFormResponseIds.add(ticket.formResponseId);
      }
    });
  });

  return formResponses.filter((response) => {
    const id = response.formResponseId;
    if (typeFormResponseIds.has(id)) {
      return true;
    }
    // Unlinked responses only surface under General Admission.
    return includeCatchAll && allLinkedFormResponseIds !== null && !allLinkedFormResponseIds.has(id);
  });
}

/** Human-readable value for a single form section (matches organiser tooling). */
export function getFormSectionAnswerDisplay(section: FormSection | undefined): string {
  if (!section) return "—";

  switch (section.type) {
    case FormSectionType.TEXT:
    case FormSectionType.DROPDOWN_SELECT:
    case FormSectionType.MULTIPLE_CHOICE:
      return section.answer || "—";
    case FormSectionType.TICKBOX:
      return section.answer?.join(", ") || "—";
    case FormSectionType.DATE_TIME:
      if (!section.timestamp) return "—";
      try {
        return new Date(section.timestamp).toLocaleString();
      } catch {
        return section.timestamp;
      }
    case FormSectionType.FILE_UPLOAD:
      return section.fileUrl || "—";
    default:
      return "—";
  }
}
