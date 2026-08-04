package com.functions.events.repositories;

import java.util.HashMap;
import java.util.Map;

import com.functions.events.models.ResolvedEventTicketType;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.Transaction;

/**
 * Firestore helpers for {@code eventTicketTypes.{typeId}} inventory fields.
 * Upserts General Admission metadata so legacy events without a map get seeded on first write.
 */
public class EventTicketTypeRepository {
    private EventTicketTypeRepository() {
    }

    public static void setVacancy(Transaction transaction, DocumentReference eventRef,
            ResolvedEventTicketType type, int vacancy) {
        Map<String, Object> updates = new HashMap<>();
        putTicketTypeSnapshot(updates, type);
        putTicketTypeField(updates, type.getId(), "vacancy", vacancy);
        transaction.update(eventRef, updates);
    }

    public static void incrementVacancy(Transaction transaction, DocumentReference eventRef,
            ResolvedEventTicketType type, long delta) {
        Integer currentVacancy = type.getVacancy();
        if (currentVacancy == null) {
            throw new IllegalStateException(
                    "Cannot increment vacancy: resolved ticket type " + type.getId() + " has null vacancy");
        }
        int newVacancy = Math.toIntExact(currentVacancy.longValue() + delta);

        Map<String, Object> updates = new HashMap<>();
        putTicketTypeSnapshot(updates, type);
        // Absolute map write avoids stale nested increments; top-level fields stay in sync on writes.
        putTicketTypeField(updates, type.getId(), "vacancy", newVacancy);
        transaction.update(eventRef, updates);
    }

    private static void putTicketTypeSnapshot(Map<String, Object> updates, ResolvedEventTicketType type) {
        putTicketTypeField(updates, type.getId(), "id", type.getId());
        putTicketTypeField(updates, type.getId(), "name", type.getName());
        if (type.getPrice() != null) {
            putTicketTypeField(updates, type.getId(), "price", type.getPrice());
        }
        if (type.getCapacity() != null) {
            putTicketTypeField(updates, type.getId(), "capacity", type.getCapacity());
        }
    }

    private static void putTicketTypeField(Map<String, Object> updates, String typeId, String field,
            Object value) {
        updates.put("eventTicketTypes." + typeId + "." + field, value);
    }
}
