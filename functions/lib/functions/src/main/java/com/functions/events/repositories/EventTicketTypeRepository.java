package com.functions.events.repositories;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.events.models.ResolvedEventTicketType;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.Transaction;

/**
 * Firestore dual-write helpers for top-level event fields and nested
 * {@code eventTicketTypes.{typeId}} fields.
 *
 * <p>Until multi-type inventory ships, every write keeps both sources in sync and upserts
 * ticket-type id/name/price/capacity so legacy events without a map still get a General entry.
 */
public class EventTicketTypeRepository {
    private static final Logger logger = LoggerFactory.getLogger(EventTicketTypeRepository.class);

    private EventTicketTypeRepository() {
    }

    /**
     * Writes vacancy to both {@code event.vacancy} and
     * {@code eventTicketTypes.{typeId}.vacancy}, and reconciles map metadata/price/capacity.
     */
    public static void setVacancy(Transaction transaction, DocumentReference eventRef,
            ResolvedEventTicketType type, int vacancy) {
        Map<String, Object> updates = new HashMap<>();
        updates.put("vacancy", vacancy);
        putTicketTypeField(updates, type.getId(), "vacancy", vacancy);
        putReconcileFields(updates, type);
        transaction.update(eventRef, updates);
        logger.info("Set vacancy={} for event {} ticketTypeId={}",
                vacancy, eventRef.getId(), type.getId());
    }

    /**
     * Increments top-level vacancy and sets ticket-type vacancy to the reconciled absolute value.
     * Using an absolute write for the map avoids perpetuating stale deltas when map and top-level
     * had diverged.
     */
    public static void incrementVacancy(Transaction transaction, DocumentReference eventRef,
            ResolvedEventTicketType type, long delta) {
        Integer currentVacancy = type.getVacancy();
        if (currentVacancy == null) {
            throw new IllegalStateException(
                    "Cannot increment vacancy: resolved ticket type " + type.getId() + " has null vacancy");
        }
        int newVacancy = Math.toIntExact(currentVacancy.longValue() + delta);

        Map<String, Object> updates = new HashMap<>();
        // Keep FieldValue.increment on top-level for concurrent safety with other writers that
        // still touch only event.vacancy; map gets the absolute reconciled value.
        updates.put("vacancy", FieldValue.increment(delta));
        putTicketTypeField(updates, type.getId(), "vacancy", newVacancy);
        putReconcileFields(updates, type);
        transaction.update(eventRef, updates);
        logger.info("Incremented vacancy by {} (map reconciled to {}) for event {} ticketTypeId={}",
                delta, newVacancy, eventRef.getId(), type.getId());
    }

    /**
     * Writes price to both top-level and ticket-type fields.
     */
    public static void setPrice(Transaction transaction, DocumentReference eventRef,
            ResolvedEventTicketType type, int price) {
        Map<String, Object> updates = new HashMap<>();
        updates.put("price", price);
        putTicketTypeField(updates, type.getId(), "price", price);
        putTicketTypeField(updates, type.getId(), "id", type.getId());
        putTicketTypeField(updates, type.getId(), "name", type.getName());
        if (type.getCapacity() != null) {
            putTicketTypeField(updates, type.getId(), "capacity", type.getCapacity());
        }
        if (type.getVacancy() != null) {
            putTicketTypeField(updates, type.getId(), "vacancy", type.getVacancy());
        }
        transaction.update(eventRef, updates);
    }

    /**
     * Writes price, capacity, and vacancy to both top-level and ticket-type fields.
     */
    public static void setPriceCapacityVacancy(Transaction transaction, DocumentReference eventRef,
            ResolvedEventTicketType type, int price, int capacity, int vacancy) {
        Map<String, Object> updates = new HashMap<>();
        updates.put("price", price);
        updates.put("capacity", capacity);
        updates.put("vacancy", vacancy);
        putTicketTypeField(updates, type.getId(), "price", price);
        putTicketTypeField(updates, type.getId(), "capacity", capacity);
        putTicketTypeField(updates, type.getId(), "vacancy", vacancy);
        putTicketTypeField(updates, type.getId(), "id", type.getId());
        putTicketTypeField(updates, type.getId(), "name", type.getName());
        transaction.update(eventRef, updates);
    }

    private static void putTicketTypeField(Map<String, Object> updates, String typeId, String field,
            Object value) {
        updates.put("eventTicketTypes." + typeId + "." + field, value);
    }

    /**
     * Force ticket type id/name/price/capacity to match the resolved top-level snapshot.
     * Vacancy is written by the caller to the post-update value.
     */
    private static void putReconcileFields(Map<String, Object> updates, ResolvedEventTicketType type) {
        putTicketTypeField(updates, type.getId(), "id", type.getId());
        putTicketTypeField(updates, type.getId(), "name", type.getName());
        if (type.getPrice() != null) {
            putTicketTypeField(updates, type.getId(), "price", type.getPrice());
        }
        if (type.getCapacity() != null) {
            putTicketTypeField(updates, type.getId(), "capacity", type.getCapacity());
        }
    }
}
