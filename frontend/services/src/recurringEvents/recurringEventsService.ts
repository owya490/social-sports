import { NewEventData } from "@/interfaces/EventTypes";
import {
  Frequency,
  NewRecurrenceData,
  NewRecurrenceFormData,
  RecurringEventsData,
  RecurringEventsId,
} from "@/interfaces/RecurringEventTypes";
import { Logger } from "@/observability/logger";
import { Timestamp, collection, doc, writeBatch } from "firebase/firestore";
import { createEvent } from "../events/eventsService";
import { db } from "../firebase";
import { CollectionPaths, recurringEventsStatus } from "./recurringEventsConstants";

export const recurringEventsServiceLogger = new Logger("recurringEventsServiceLogger");

export async function createRecurringEvents(
  eventData: NewEventData,
  recurrenceData: NewRecurrenceData
): Promise<RecurringEventsId> {
  recurringEventsServiceLogger.info("createRecurringEvents");
  const batch = writeBatch(db);
  // const isActive =
  //   Timestamp.now().toMillis() < recurrenceData.recurrenceEndDate.toMillis()
  //     ? recurringEventsStatus.Active
  //     : recurringEventsStatus.Inactive;
  const docRef = doc(
    collection(
      db,
      CollectionPaths.RecurringEvents,
      eventData.isActive ? recurringEventsStatus.Active : recurringEventsStatus.Inactive
    )
  );

  const recurringEventsData: RecurringEventsData = {
    eventDataTemplate: eventData,
    recurrenceData,
  };
  batch.set(docRef, recurringEventsData);

  // We always create the first recurrence of the event.
  createEvent(eventData, batch);

  // if (
  //   isActive === recurringEventsStatus.Active &&
  //   durationInDaysCeil(Timestamp.now(), recurrenceData.firstStartDate) <= recurrenceData.createDaysBefore
  // ) {
  //   await createEvent(eventData, batch);
  // }

  batch.commit();

  return docRef.id;
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
