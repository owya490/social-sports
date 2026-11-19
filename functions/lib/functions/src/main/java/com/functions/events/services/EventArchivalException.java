package com.functions.events.services;

/**
 * The event cannot be archived because its stored data is missing or inconsistent.
 * Callers skip that event. A Firestore failure is a different error and must propagate.
 */
class EventArchivalException extends RuntimeException {
    EventArchivalException(String message) {
        super(message);
    }
}
