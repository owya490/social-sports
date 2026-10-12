import { EventId, NewEventData } from "@/interfaces/EventTypes";
import { EndpointType } from "@/interfaces/FunctionsTypes";
import {
  Frequency,
  NewRecurrenceFormData,
  RecurrenceTemplate,
  RecurrenceTemplateId,
} from "@/interfaces/RecurringEventTypes";
import { UserId } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import { Timestamp } from "firebase/firestore";
import { addCalendarDaysToYmd, dateAndTimeInZoneToDate } from "../datetimeUtils";
import { isIanaZone } from "../venueTimeZone";
import { getPrivateUserById } from "../users/usersService";
import {
  applyGeneralAdmissionInventoryFields,
  mergeInventoryIntoEventData,
} from "../events/eventsUtils/eventTicketTypesUtils";
import { executeGlobalAppControllerFunction } from "../functions/functionsUtils";
import { findRecurrenceTemplateDoc } from "./recurringEventsUtils";

export const recurringEventsServiceLogger = new Logger("recurringEventsServiceLogger");

interface CreateRecurrenceTemplateResponse {
  eventId: EventId;
  recurrenceTemplateId: RecurrenceTemplateId;
}

interface UpdateRecurrenceTemplateResponse {
  recurrenceTemplateId: RecurrenceTemplateId;
}

type UpdateRecurrenceTemplateData = {
  eventData?: NewEventData;
  recurrenceData?: NewRecurrenceFormData;
};

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

  const response = await executeGlobalAppControllerFunction<typeof content, CreateRecurrenceTemplateResponse>(
    EndpointType.CREATE_RECURRENCE_TEMPLATE,
    content,
    { attachAuth: true }
  );
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
    };
  } catch (error) {
    recurringEventsServiceLogger.error(
      `Error getting Recurrence Template by Id, id=${recurrenceTemplateId}, error=${error}`
    );
    throw error;
  }
}

export async function updateRecurrenceTemplate(
  recurrenceTemplateId: RecurrenceTemplateId,
  updatedData: UpdateRecurrenceTemplateData
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

  const response = await executeGlobalAppControllerFunction<typeof content, UpdateRecurrenceTemplateResponse>(
    EndpointType.UPDATE_RECURRENCE_TEMPLATE,
    content,
    { attachAuth: true }
  );
  return response.recurrenceTemplateId;
}

export async function updateRecurrenceTemplateEventData(
  recurrenceTemplateId: RecurrenceTemplateId,
  updatedData: Partial<NewEventData>
): Promise<boolean> {
  recurringEventsServiceLogger.info(`Updating recurrence template id ${recurrenceTemplateId} event data`);
  const recurrenceTemplate = await getRecurrenceTemplate(recurrenceTemplateId);
  const { price, capacity, vacancy, ...restUpdatedData } = updatedData;
  const mergedEventData = mergeInventoryIntoEventData(
    { ...recurrenceTemplate.eventData, ...restUpdatedData },
    { price, capacity, vacancy }
  );
  await updateRecurrenceTemplate(recurrenceTemplateId, {
    eventData: mergedEventData,
  });
  return true;
}

export async function updateRecurrenceTemplateRecurrenceData(
  recurrenceTemplateId: RecurrenceTemplateId,
  updatedData: Partial<NewRecurrenceFormData>
): Promise<void> {
  recurringEventsServiceLogger.info(`Updating recurrence template id ${recurrenceTemplateId} recurrence data`);
  const recurrenceTemplate = await getRecurrenceTemplate(recurrenceTemplateId);
  await updateRecurrenceTemplate(recurrenceTemplateId, {
    recurrenceData: {
      frequency: recurrenceTemplate.recurrenceData.frequency,
      recurrenceAmount: recurrenceTemplate.recurrenceData.recurrenceAmount,
      createDaysBefore: recurrenceTemplate.recurrenceData.createDaysBefore,
      recurrenceEnabled: recurrenceTemplate.recurrenceData.recurrenceEnabled,
      ...updatedData,
    },
  });
}

export function calculateRecurrenceDates(
  newRecurrenceFormData: NewRecurrenceFormData,
  startDate: Timestamp,
  timeZone?: string | null
) {
  const inVenueZone = isIanaZone(timeZone);
  const advance = (days: number, months: number) => {
    if (!inVenueZone) {
      const recurrenceDate = startDate.toDate();
      if (months !== 0) {
        recurrenceDate.setMonth(recurrenceDate.getMonth() + months);
      }
      if (days !== 0) {
        recurrenceDate.setDate(recurrenceDate.getDate() + days);
      }
      return Timestamp.fromDate(recurrenceDate);
    }
    return Timestamp.fromDate(addCalendarInZone(startDate.toDate(), timeZone, days, months));
  };
  switch (newRecurrenceFormData.frequency) {
    case Frequency.WEEKLY:
      return [...Array(newRecurrenceFormData.recurrenceAmount).keys()].map((recurrence) =>
        advance(7 * (recurrence + 1), 0)
      );
    case Frequency.FORTNIGHTLY:
      return [...Array(newRecurrenceFormData.recurrenceAmount).keys()].map((recurrence) =>
        advance(14 * (recurrence + 1), 0)
      );
    case Frequency.MONTHLY:
      return [...Array(newRecurrenceFormData.recurrenceAmount).keys()].map((recurrence) =>
        advance(0, recurrence + 1)
      );
    default:
      return [];
  }
}

function addCalendarInZone(instant: Date, timeZone: string, days: number, months: number): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(instant);
  const value: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      value[part.type] = part.value;
    }
  }
  let year = Number(value.year);
  let month = Number(value.month);
  let day = Number(value.day);
  if (months !== 0) {
    const shifted = new Date(Date.UTC(year, month - 1 + months, day));
    year = shifted.getUTCFullYear();
    month = shifted.getUTCMonth() + 1;
    day = shifted.getUTCDate();
  }
  const ymd = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const shiftedYmd = days === 0 ? ymd : addCalendarDaysToYmd(ymd, days);
  const hour = String(Number(value.hour) % 24).padStart(2, "0");
  const minute = value.minute ?? "00";
  return dateAndTimeInZoneToDate(shiftedYmd, `${hour}:${minute}`, timeZone);
}

export function calculateRecurrenceEnded(recurrenceTemplate: RecurrenceTemplate) {
  const lastRecurrence =
    recurrenceTemplate.recurrenceData.allRecurrences[recurrenceTemplate.recurrenceData.allRecurrences.length - 1];
  const lastRecurrenceKey = lastRecurrence.toString();
  const lastPastRecurrenceCreated = recurrenceTemplate.recurrenceData.pastRecurrences[lastRecurrenceKey] !== undefined;

  const todaysDate = Date.now();
  const pastLastRecurrence = todaysDate > lastRecurrence.toMillis();

  return lastPastRecurrenceCreated || pastLastRecurrence || !recurrenceTemplate.eventData.isActive;
}
