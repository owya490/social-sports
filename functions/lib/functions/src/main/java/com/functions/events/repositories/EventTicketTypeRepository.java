package com.functions.events.repositories;

import java.util.Map;

import com.functions.events.models.ResolvedEventTicketType;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Transaction;

/**
 * Writes inventory to eventTicketTypes when present, otherwise top-level fields.
 */
public class EventTicketTypeRepository {
    private EventTicketTypeRepository() {
    }

    public static void setVacancy(Transaction transaction, DocumentReference eventRef,
            ResolvedEventTicketType type, int vacancy) {
        transaction.update(eventRef, vacancyUpdate(type, vacancy));
    }

    public static void incrementVacancy(Transaction transaction, DocumentReference eventRef,
            ResolvedEventTicketType type, long delta) {
        Integer currentVacancy = type.getVacancy();
        if (currentVacancy == null) {
            throw new IllegalStateException(
                    "Cannot increment vacancy: resolved ticket type " + type.getId() + " has null vacancy");
        }
        int newVacancy = Math.toIntExact(currentVacancy.longValue() + delta);
        setVacancy(transaction, eventRef, type, newVacancy);
    }

    private static Map<String, Object> vacancyUpdate(ResolvedEventTicketType type, int vacancy) {
        if (type.isLegacy()) {
            return Map.of("vacancy", vacancy);
        }
        return Map.of("eventTicketTypes." + type.getId() + ".vacancy", vacancy);
    }
}
