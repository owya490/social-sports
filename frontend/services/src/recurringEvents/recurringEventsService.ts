import { EventId, NewEventData } from "@/interfaces/EventTypes";
import {
  Frequency,
  NewRecurrenceFormData,
  RecurrenceTemplate,
  RecurrenceTemplateId,
} from "@/interfaces/RecurringEventTypes";
import { UserId } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import { Timestamp, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { FIREBASE_FUNCTIONS_CREATE_RECURRENCE_TEMPLATE, getFirebaseFunctionByName } from "../firebaseFunctionsService";
import { getPrivateUserById } from "../users/usersService";
import { CollectionPaths } from "./recurringEventsConstants";

export const recurringEventsServiceLogger = new Logger("recurringEventsServiceLogger");

interface CreateRecurrenceTemplateResponse {
  eventId: string;
  recurrenceTemplateId: string;
}

export async function createRecurrenceTemplate(
  eventData: NewEventData,
  recurrenceData: NewRecurrenceFormData
): Promise<[EventId, RecurrenceTemplateId]> {
  recurringEventsServiceLogger.info("createRecurrenceTemplate");
  const content = {
    eventData: eventData,
    recurrenceData: recurrenceData,
  };
  // TODO: call createRecurrenceTemplateAPI
  const createRecurrenceTemplateFunction = getFirebaseFunctionByName(FIREBASE_FUNCTIONS_CREATE_RECURRENCE_TEMPLATE);
  return createRecurrenceTemplateFunction(content).then((result) => {
    const data = JSON.parse(result.data as string) as CreateRecurrenceTemplateResponse;
    return [data.eventId, data.recurrenceTemplateId];
  });
}

export async function getOrganiserRecurrenceTemplates(userId: UserId): Promise<RecurrenceTemplate[]> {
  recurringEventsServiceLogger.info(`Getting organiser recurrence templates, organiserId=${userId}`);
  try {
    const privateDoc = await getPrivateUserById(userId);

    // TODO add recurrence templates
    const organiserEvents = privateDoc.organiserEvents || [];
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
    const recurrenceTemplateDocRef = doc(db, CollectionPaths.RecurrenceTemplates, recurrenceTemplateId);
    const recurrenceTemplateDoc = await getDoc(recurrenceTemplateDocRef);
    const recurrenceTemplate = recurrenceTemplateDoc.data() as RecurrenceTemplate;
    return recurrenceTemplate;
  } catch (error) {
    recurringEventsServiceLogger.error(
      `Error getting Recurrence Template by Id, id=${recurrenceTemplateId}, error=${error}`
    );
    throw error;
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
