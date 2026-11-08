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
  const lastRecurrence =
    recurrenceTemplate.recurrenceData.allRecurrences[recurrenceTemplate.recurrenceData.allRecurrences.length - 1];
  const lastRecurrenceKey = lastRecurrence.toString();
  const lastPastRecurrenceCreated = recurrenceTemplate.recurrenceData.pastRecurrences[lastRecurrenceKey] !== undefined;

  const todaysDate = Date.now();
  const pastLastRecurrence = todaysDate > lastRecurrence.toMillis();

  return lastPastRecurrenceCreated || pastLastRecurrence || !recurrenceTemplate.eventData.isActive;
}
