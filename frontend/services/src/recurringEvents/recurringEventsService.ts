import { EventId, NewEventData } from "@/interfaces/EventTypes";
import { EndpointType } from "@/interfaces/FunctionsTypes";
import {
  Frequency,
  NewRecurrenceFormData,
  RecurrenceOccurrence,
  RecurrenceTemplate,
  RecurrenceTemplateId,
  isRecurrenceTemplateV2,
} from "@/interfaces/RecurringEventTypes";
import { UserId } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import { Timestamp } from "firebase/firestore";
import { executeGlobalAppControllerFunction } from "../functions/functionsUtils";
import { getPrivateUserById } from "../users/usersService";
import {
  applyGeneralAdmissionInventoryFields,
  mergeInventoryIntoEventData,
} from "../events/eventsUtils/eventTicketTypesUtils";
import {
  calculateRecurrenceEndedV2,
  serializeOccurrenceForRequest,
} from "./recurrenceV2Utils";
import {
  findRecurrenceTemplateDoc,
  getCreateRecurringTemplateUrl,
  getUpdateRecurringTemplateUrl,
} from "./recurringEventsUtils";

export const recurringEventsServiceLogger = new Logger("recurringEventsServiceLogger");

interface CreateRecurrenceTemplateResponse {
  eventId: EventId;
  recurrenceTemplateId: RecurrenceTemplateId;
}

interface CreateRecurrenceTemplateV2Response {
  eventId?: EventId | null;
  recurrenceTemplateId: RecurrenceTemplateId;
}

interface UpdateRecurrenceTemplateResponse {
  recurrenceTemplateId: RecurrenceTemplateId;
}

interface UpdateRecurrenceTemplateV2Response {
  recurrenceTemplateId: RecurrenceTemplateId;
  eventId?: EventId | null;
}

function toTimestamp(value: Timestamp | { seconds: number; nanoseconds?: number } | Date): Timestamp {
  if (value instanceof Timestamp) {
    return value;
  }
  if (value instanceof Date) {
    return Timestamp.fromDate(value);
  }
  return new Timestamp(value.seconds, value.nanoseconds ?? 0);
}

function hydrateOccurrences(occurrences: RecurrenceOccurrence[] | undefined): RecurrenceOccurrence[] | undefined {
  if (!occurrences) {
    return occurrences;
  }
  return occurrences.map((occurrence) => ({
    ...occurrence,
    eventStart: toTimestamp(occurrence.eventStart),
    createDate: toTimestamp(occurrence.createDate),
    eventId: occurrence.eventId || undefined,
  }));
}

function serializeEventDataForRequest(eventData: NewEventData) {
  return {
    ...eventData,
    startDate: eventData.startDate.toDate().toISOString(),
    endDate: eventData.endDate.toDate().toISOString(),
    registrationDeadline: eventData.registrationDeadline.toDate().toISOString(),
  };
}

export async function createRecurrenceTemplateV2(
  eventData: NewEventData,
  recurrenceData: NewRecurrenceFormData
): Promise<[EventId | null, RecurrenceTemplateId]> {
  const occurrences = recurrenceData.occurrences ?? [];
  if (occurrences.length === 0) {
    throw new Error("At least one recurrence date is required");
  }

  recurringEventsServiceLogger.info("createRecurrenceTemplateV2");
  const response = await executeGlobalAppControllerFunction<
    {
      eventData: ReturnType<typeof serializeEventDataForRequest>;
      occurrences: ReturnType<typeof serializeOccurrenceForRequest>[];
      recurrenceEnabled: boolean;
      reservedSlots: NewRecurrenceFormData["reservedSlots"];
    },
    CreateRecurrenceTemplateV2Response
  >(
    EndpointType.CREATE_RECURRENCE_TEMPLATE_V2,
    {
      eventData: serializeEventDataForRequest(eventData),
      occurrences: occurrences.map(serializeOccurrenceForRequest),
      recurrenceEnabled: true,
      reservedSlots: recurrenceData.reservedSlots ?? [],
    },
    { attachAuth: true }
  );
  return [response.eventId ?? null, response.recurrenceTemplateId];
}

export async function updateRecurrenceTemplateV2(
  recurrenceTemplateId: RecurrenceTemplateId,
  updatedData: {
    eventData?: NewEventData | null;
    occurrences?: RecurrenceOccurrence[] | null;
    recurrenceEnabled?: boolean | null;
    reservedSlots?: NewRecurrenceFormData["reservedSlots"] | null;
  }
): Promise<UpdateRecurrenceTemplateV2Response> {
  recurringEventsServiceLogger.info(`updateRecurrenceTemplateV2 ${recurrenceTemplateId}`);
  return await executeGlobalAppControllerFunction<
    {
      recurrenceTemplateId: RecurrenceTemplateId;
      eventData: ReturnType<typeof serializeEventDataForRequest> | null;
      occurrences: ReturnType<typeof serializeOccurrenceForRequest>[] | null;
      recurrenceEnabled: boolean | null;
      reservedSlots: NewRecurrenceFormData["reservedSlots"] | null;
    },
    UpdateRecurrenceTemplateV2Response
  >(
    EndpointType.UPDATE_RECURRENCE_TEMPLATE_V2,
    {
      recurrenceTemplateId,
      eventData: updatedData.eventData ? serializeEventDataForRequest(updatedData.eventData) : null,
      occurrences: updatedData.occurrences ? updatedData.occurrences.map(serializeOccurrenceForRequest) : null,
      recurrenceEnabled: updatedData.recurrenceEnabled ?? null,
      reservedSlots: updatedData.reservedSlots ?? null,
    },
    { attachAuth: true }
  );
}

export async function createRecurrenceTemplate(
  eventData: NewEventData,
  recurrenceData: NewRecurrenceFormData
): Promise<[EventId, RecurrenceTemplateId]> {
  recurringEventsServiceLogger.info("createRecurrenceTemplate");
  const content = {
    eventData: {
      ...eventData,
      startDate: eventData.startDate.toDate(),
      endDate: eventData.endDate.toDate(),
      registrationDeadline: eventData.registrationDeadline.toDate(),
    },
    recurrenceData: recurrenceData,
  };

  const rawResponse = await fetch(getCreateRecurringTemplateUrl(), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(content),
  });
  const response = (await rawResponse.json()) as CreateRecurrenceTemplateResponse;
  return [response.eventId, response.recurrenceTemplateId];
}

export async function getOrganiserRecurrenceTemplates(userId: UserId): Promise<RecurrenceTemplate[]> {
  recurringEventsServiceLogger.info(`Getting organiser recurrence templates, organiserId=${userId}`);
  try {
    const privateDoc = await getPrivateUserById(userId);

    // TODO add recurrence templates
    const organiserEvents = privateDoc.recurrenceTemplates || [];
    const recurrenceTemplateList: RecurrenceTemplate[] = [];
    for (const recurrenceTemplateId of organiserEvents) {
      try {
        const recurrenceTemplate: RecurrenceTemplate = await getRecurrenceTemplate(recurrenceTemplateId);
        recurrenceTemplateList.push(recurrenceTemplate);
      } catch {
        recurringEventsServiceLogger.warn(
          `Organiser cannot find a recurrence template which is present in their personal template list. organiser=${userId} templateId=${recurrenceTemplateId}`
        );
      }
    }
    return recurrenceTemplateList;
  } catch (error) {
    throw error;
  }
}

export async function getRecurrenceTemplate(recurrenceTemplateId: RecurrenceTemplateId): Promise<RecurrenceTemplate> {
  recurringEventsServiceLogger.info(`Getting Recurrence Template by Id, id=${recurrenceTemplateId}`);
  try {
    const recurrenceTemplateDoc = await findRecurrenceTemplateDoc(recurrenceTemplateId);
    const recurrenceTemplate = { ...recurrenceTemplateDoc.data(), recurrenceTemplateId } as RecurrenceTemplate;
    return {
      ...recurrenceTemplate,
      eventData: applyGeneralAdmissionInventoryFields(recurrenceTemplate.eventData),
      recurrenceData: {
        ...recurrenceTemplate.recurrenceData,
        occurrences: hydrateOccurrences(recurrenceTemplate.recurrenceData.occurrences),
      },
    };
  } catch (error) {
    recurringEventsServiceLogger.error(
      `Error getting Recurrence Template by Id, id=${recurrenceTemplateId}, error=${error}`
    );
    throw error;
  }
}

// Should be a partial of eventData or NewRecurrenceFormData
export async function updateRecurrenceTemplate(
  recurrenceTemplateId: RecurrenceTemplateId,
  updatedData: {
    eventData?: NewEventData;
    recurrenceData?: Partial<NewRecurrenceFormData> | null;
  }
) {
  recurringEventsServiceLogger.info(`Updating Recurrence Template ${recurrenceTemplateId}`);
  let eventData = null;
  if (updatedData.eventData) {
    eventData = {
      ...updatedData.eventData,
      startDate: updatedData.eventData.startDate.toDate(),
      endDate: updatedData.eventData.endDate.toDate(),
      registrationDeadline: updatedData.eventData.registrationDeadline.toDate(),
    };
  }
  const recurrenceData = updatedData.recurrenceData || null;
  const content = {
    recurrenceTemplateId: recurrenceTemplateId,
    eventData: eventData,
    recurrenceData: recurrenceData,
  };

  const rawResponse = await fetch(getUpdateRecurringTemplateUrl(), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(content),
  });
  const response = (await rawResponse.json()) as UpdateRecurrenceTemplateResponse;
  return response.recurrenceTemplateId;
}

export async function updateRecurrenceTemplateEventData(
  recurrenceTemplateId: RecurrenceTemplateId,
  updatedData: Partial<NewEventData>
) {
  recurringEventsServiceLogger.info(`Updating recurrence template id ${recurrenceTemplateId} event data`);
  try {
    const recurrenceTemplate = await getRecurrenceTemplate(recurrenceTemplateId);
    const { price, capacity, vacancy, ...restUpdatedData } = updatedData;
    const mergedEventData = mergeInventoryIntoEventData(
      { ...recurrenceTemplate.eventData, ...restUpdatedData },
      { price, capacity, vacancy }
    );
    const response = await (isRecurrenceTemplateV2(recurrenceTemplate)
      ? updateRecurrenceTemplateV2(recurrenceTemplateId, { eventData: mergedEventData })
      : updateRecurrenceTemplate(recurrenceTemplateId, {
          eventData: mergedEventData,
        }));
    return response ? true : false;
  } catch {
    // Logged upstream in get/update; callers treat a missing result as failure.
  }
}

export async function updateRecurrenceTemplateRecurrenceData(
  recurrenceTemplateId: RecurrenceTemplateId,
  updatedData: Partial<NewRecurrenceFormData>
) {
  recurringEventsServiceLogger.info(`Updating recurrence template id ${recurrenceTemplateId} recurrence data`);
  try {
    const recurrenceTemplate = await getRecurrenceTemplate(recurrenceTemplateId);
    if (isRecurrenceTemplateV2(recurrenceTemplate)) {
      await updateRecurrenceTemplateV2(recurrenceTemplateId, {
        occurrences: updatedData.occurrences ?? recurrenceTemplate.recurrenceData.occurrences ?? [],
        recurrenceEnabled: updatedData.recurrenceEnabled ?? recurrenceTemplate.recurrenceData.recurrenceEnabled,
        reservedSlots: updatedData.reservedSlots ?? recurrenceTemplate.recurrenceData.reservedSlots ?? [],
      });
      return;
    }
    await updateRecurrenceTemplate(recurrenceTemplateId, {
      recurrenceData: {
        frequency: recurrenceTemplate.recurrenceData.frequency,
        recurrenceAmount: recurrenceTemplate.recurrenceData.recurrenceAmount,
        createDaysBefore: recurrenceTemplate.recurrenceData.createDaysBefore,
        recurrenceEnabled: recurrenceTemplate.recurrenceData.recurrenceEnabled,
        ...updatedData,
      },
    });
  } catch {
    // Logged upstream in get/update; callers treat a missing result as failure.
  }
}

export function calculateRecurrenceDates(newRecurrenceFormData: NewRecurrenceFormData, startDate: Timestamp) {
  switch (newRecurrenceFormData.frequency) {
    case Frequency.WEEKLY:
      return [...Array(newRecurrenceFormData.recurrenceAmount).keys()].map((recurrence) => {
        recurrence += 1;
        const recurrenceDate = startDate.toDate();
        recurrenceDate.setDate(recurrenceDate.getDate() + 7 * recurrence);
        return Timestamp.fromDate(recurrenceDate);
      });
    case Frequency.FORTNIGHTLY:
      return [...Array(newRecurrenceFormData.recurrenceAmount).keys()].map((recurrence) => {
        recurrence += 1;
        const recurrenceDate = startDate.toDate();
        recurrenceDate.setDate(recurrenceDate.getDate() + 14 * recurrence);
        return Timestamp.fromDate(recurrenceDate);
      });
    case Frequency.MONTHLY:
      return [...Array(newRecurrenceFormData.recurrenceAmount).keys()].map((recurrence) => {
        recurrence += 1;
        const recurrenceDate = startDate.toDate();
        recurrenceDate.setMonth(recurrenceDate.getMonth() + 1 * recurrence);
        return Timestamp.fromDate(recurrenceDate);
      });
    default:
      return [];
  }
}

export function calculateRecurrenceEnded(recurrenceTemplate: RecurrenceTemplate) {
  if (isRecurrenceTemplateV2(recurrenceTemplate)) {
    return calculateRecurrenceEndedV2(recurrenceTemplate);
  }
  const allRecurrences = recurrenceTemplate.recurrenceData.allRecurrences ?? [];
  if (allRecurrences.length === 0) {
    return true;
  }
  const lastRecurrence = allRecurrences[allRecurrences.length - 1];
  const lastRecurrenceKey = lastRecurrence.toString();
  const lastPastRecurrenceCreated =
    recurrenceTemplate.recurrenceData.pastRecurrences?.[lastRecurrenceKey] !== undefined;

  const todaysDate = Date.now();
  const pastLastRecurrence = todaysDate > lastRecurrence.toMillis();

  return lastPastRecurrenceCreated || pastLastRecurrence || !recurrenceTemplate.eventData.isActive;
}
