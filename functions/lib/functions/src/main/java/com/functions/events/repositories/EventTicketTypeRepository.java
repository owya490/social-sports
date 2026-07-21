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
 */
public class EventTicketTypeRepository {
    private static final Logger logger = LoggerFactory.getLogger(EventTicketTypeRepository.class);

    private EventTicketTypeRepository() {
    }

    /**
     * Writes vacancy to both {@code event.vacancy} and
     * {@code eventTicketTypes.{typeId}.vacancy}.
     * When the type was synthesized (legacy event with no map), also seeds name/price/capacity.
     */
    public static void setVacancy(Transaction transaction, DocumentReference eventRef,
            ResolvedEventTicketType type, int vacancy) {
        Map<String, Object> updates = new HashMap<>();
        updates.put("vacancy", vacancy);
        putTicketTypeField(updates, type.getId(), "vacancy", vacancy);
        if (type.isSynthesized()) {
            putTicketTypeSeedFields(updates, type);
        }
        transaction.update(eventRef, updates);
        logger.info("Set vacancy={} for event {} ticketTypeId={}", vacancy, eventRef.getId(), type.getId());
    }

    /**
     * Increments vacancy on both top-level and ticket-type fields.
     */
    public static void incrementVacancy(Transaction transaction, DocumentReference eventRef,
            ResolvedEventTicketType type, long delta) {
        Map<String, Object> updates = new HashMap<>();
        updates.put("vacancy", FieldValue.increment(delta));
        putTicketTypeField(updates, type.getId(), "vacancy", FieldValue.increment(delta));
        if (type.isSynthesized()) {
            putTicketTypeSeedFields(updates, type);
        }
        transaction.update(eventRef, updates);
        logger.info("Incremented vacancy by {} for event {} ticketTypeId={}", delta, eventRef.getId(),
                type.getId());
    }

    /**
     * Writes price to both top-level and ticket-type fields.
     */
    public static void setPrice(Transaction transaction, DocumentReference eventRef,
            ResolvedEventTicketType type, int price) {
        Map<String, Object> updates = new HashMap<>();
        updates.put("price", price);
        putTicketTypeField(updates, type.getId(), "price", price);
        if (type.isSynthesized()) {
            putTicketTypeSeedFields(updates, type);
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
        if (type.isSynthesized()) {
            putTicketTypeField(updates, type.getId(), "id", type.getId());
            putTicketTypeField(updates, type.getId(), "name", type.getName());
        }
        transaction.update(eventRef, updates);
    }

    private static void putTicketTypeField(Map<String, Object> updates, String typeId, String field,
            Object value) {
        updates.put("eventTicketTypes." + typeId + "." + field, value);
    }

    private static void putTicketTypeSeedFields(Map<String, Object> updates, ResolvedEventTicketType type) {
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
