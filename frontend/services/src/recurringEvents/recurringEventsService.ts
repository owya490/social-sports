import { EventId, NewEventData } from "@/interfaces/EventTypes";
import { Frequency, NewRecurrenceFormData, RecurrenceTemplateId } from "@/interfaces/RecurringEventTypes";
import { Logger } from "@/observability/logger";
import { Timestamp } from "firebase/firestore";
import { FIREBASE_FUNCTIONS_CREATE_RECURRENCE_TEMPLATE, getFirebaseFunctionByName } from "../firebaseFunctionsService";

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
  }
}
