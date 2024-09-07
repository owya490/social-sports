import { NewEventData } from "@/interfaces/EventTypes";
import { NewRecurrenceData, RecurringEventsData, RecurringEventsId } from "@/interfaces/RecurringEventTypes";
import { Logger } from "@/observability/logger";
import { collection, doc, Timestamp, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { CollectionPaths, recurringEventsStatus } from "./recurringEventsConstants";
import { createEvent } from "../events/eventsService";
import { durationInDaysCeil } from "../datetimeUtils";

export const recurringEventsServiceLogger = new Logger("recurringEventsServiceLogger");

export async function createRecurringEvents(
  eventData: NewEventData,
  recurrenceData: NewRecurrenceData
): Promise<RecurringEventsId> {
  recurringEventsServiceLogger.info("createRecurringEvents");
  const batch = writeBatch(db);
  const isActive =
    Timestamp.now().toMillis() < recurrenceData.recurrenceEndDate.toMillis()
      ? recurringEventsStatus.Active
      : recurringEventsStatus.Inactive;
  const docRef = doc(collection(db, CollectionPaths.RecurringEvents, isActive));
  const recurringEventsData: RecurringEventsData = {
    eventDataTemplate: eventData,
    recurrenceData,
  };
  batch.set(docRef, recurringEventsData);

  if (
    isActive === recurringEventsStatus.Active &&
    durationInDaysCeil(Timestamp.now(), recurrenceData.firstStartDate) <= recurrenceData.createDaysBefore
  ) {
    await createEvent(eventData, batch);
  }

  batch.commit();

  return docRef.id;
}
