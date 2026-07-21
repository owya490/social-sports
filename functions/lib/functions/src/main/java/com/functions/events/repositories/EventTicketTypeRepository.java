package com.functions.events.repositories;

import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.Transaction;

/**
 * Firestore helpers for {@code eventTicketTypes.{typeId}} inventory fields.
 * Writes only the ticket-type map (top-level price/capacity/vacancy are owned by sync / UI).
 */
public class EventTicketTypeRepository {
    private EventTicketTypeRepository() {
    }

    public static void setVacancy(Transaction transaction, DocumentReference eventRef, String typeId,
            int vacancy) {
        transaction.update(eventRef, "eventTicketTypes." + typeId + ".vacancy", vacancy);
    }

    public static void incrementVacancy(Transaction transaction, DocumentReference eventRef, String typeId,
            long delta) {
        transaction.update(eventRef, "eventTicketTypes." + typeId + ".vacancy", FieldValue.increment(delta));
    }
}
