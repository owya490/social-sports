import { NewRecurrenceFormData, RecurrenceData, RecurrenceTemplateId } from "@/interfaces/RecurringEventTypes";
import { Environment, getEnvironment } from "@/utilities/environment";
import { DocumentData, QueryDocumentSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import {
  CREATE_RECURRING_TEMPLATE_URL,
  RECURRING_EVENT_PATHS,
  UPDATE_RECURRING_TEMPLATE_URL,
} from "./recurringEventsConstants";
import { recurringEventsServiceLogger } from "./recurringEventsService";

export async function findRecurrenceTemplateDoc(
  recurrenceTemplateId: RecurrenceTemplateId
): Promise<QueryDocumentSnapshot<DocumentData, DocumentData>> {
  try {
    // Search through the paths
    for (const path of RECURRING_EVENT_PATHS) {
      // Attempt to retrieve the document from the current subcollection
      const recurrenceTemplateRef = doc(db, path, recurrenceTemplateId);
      const recurrenceTemplateDoc = await getDoc(recurrenceTemplateRef);

      // Check if the document exists in the current subcollection
      if (recurrenceTemplateDoc.exists()) {
        recurringEventsServiceLogger.debug(`Found event document reference for eventId: ${recurrenceTemplateId}`);
        return recurrenceTemplateDoc;
      }
    }

    // If no document found, log and throw an error
    recurringEventsServiceLogger.debug(
      `Event document not found in any subcollection for eventId: ${recurrenceTemplateId}`
    );
    throw new Error("No event found in any subcollection");
  } catch (error) {
    recurringEventsServiceLogger.error(`Error finding event document for eventId: ${recurrenceTemplateId}, ${error}`);
    throw error;
  }
}

export function extractNewRecurrenceFormDataFromRecurrenceData(recurrenceData: RecurrenceData): NewRecurrenceFormData {
  return {
    frequency: recurrenceData.frequency,
    createDaysBefore: recurrenceData.createDaysBefore,
    recurrenceAmount: recurrenceData.recurrenceAmount,
    recurrenceEnabled: recurrenceData.recurrenceEnabled,
  };
}

export function getCreateRecurringTemplateUrl(): string {
  const env = getEnvironment();
  return CREATE_RECURRING_TEMPLATE_URL[`${env || Environment.DEVELOPMENT}`];
}

export function getUpdateRecurringTemplateUrl(): string {
  const env = getEnvironment();
  return UPDATE_RECURRING_TEMPLATE_URL[`${env || Environment.DEVELOPMENT}`];
}
