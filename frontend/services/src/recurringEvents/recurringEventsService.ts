import { EventId, NewEventData } from "@/interfaces/EventTypes";
import {
  Frequency,
  NewRecurrenceFormData,
  RecurrenceData,
  RecurrenceTemplate,
  RecurrenceTemplateId,
} from "@/interfaces/RecurringEventTypes";
import { UserId } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import { Timestamp, doc, getDoc, updateDoc } from "firebase/firestore";
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
    // const organiserEvents = privateDoc.organiserEvents || [];
    const organiserEvents = ["VKUNc06rWB7fQdn05jG1"];
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
    const recurrenceTemplateDocRef = doc(
      db,
      CollectionPaths.RecurrenceTemplates,
      "Active",
      "Private",
      recurrenceTemplateId
    );
    const recurrenceTemplateDoc = await getDoc(recurrenceTemplateDocRef);
    console.log(`data ${recurrenceTemplateDoc.data()}`);
    const recurrenceTemplate = { ...recurrenceTemplateDoc.data(), recurrenceTemplateId } as RecurrenceTemplate;
    console.log(recurrenceTemplate);
    return recurrenceTemplate;
  } catch (error) {
    recurringEventsServiceLogger.error(
      `Error getting Recurrence Template by Id, id=${recurrenceTemplateId}, error=${error}`
    );
    throw error;
  }
}

export async function updateRecurrenceTemplate(
  recurrenceTemplateId: RecurrenceTemplateId,
  updatedData:
    | Partial<RecurrenceTemplate>
    | { eventData: Partial<NewEventData> }
    | { recurrenceData: Partial<RecurrenceData> }
) {
  recurringEventsServiceLogger.info(`Updating Recurrence Template ${recurrenceTemplateId}`);
  try {
    // Check if document exists
    const recurrenceTemplateDocRef = doc(
      db,
      CollectionPaths.RecurrenceTemplates,
      "Active",
      "Private",
      recurrenceTemplateId
    );
    const recurrenceTemplateDocSnapshot = await getDoc(recurrenceTemplateDocRef);
    if (!recurrenceTemplateDocSnapshot.exists()) {
      throw new Error(`Recurrence Template with id ${recurrenceTemplateId} not found.`);
    }

    // If exists, update the recurrence template
    await updateDoc(recurrenceTemplateDocRef, updatedData);
    recurringEventsServiceLogger.info(`Recurrence Template with id ${recurrenceTemplateId} updated successfully.`);
  } catch (error) {
    recurringEventsServiceLogger.error(`updateRecurrenceTemplate ${error}`);
  }
}

export async function updateRecurrenceTemplateEventData(
  recurrenceTemplateId: RecurrenceTemplateId,
  updatedData: Partial<NewEventData>
) {
  recurringEventsServiceLogger.info(`Updating recurrence template id ${recurrenceTemplateId} event data`);
  const recurrenceTemplate = await getRecurrenceTemplate(recurrenceTemplateId);
  await updateRecurrenceTemplate(recurrenceTemplateId, {
    eventData: {
      ...recurrenceTemplate.eventData,
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
