package com.functions.fulfilment.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.fulfilment.models.fulfilmentSession.FulfilmentSession;

/**
 * Handoff for a crystallized fulfilment session. The queue itself is a separate
 * change; this only accepts the session object as stored.
 */
public final class FulfilmentSessionCrystallizationQueue {
    private static final Logger logger = LoggerFactory.getLogger(FulfilmentSessionCrystallizationQueue.class);

    private FulfilmentSessionCrystallizationQueue() {
    }

    public static void enqueue(FulfilmentSession session) {
        logger.info("Crystallized fulfilment session {} handed to the reconciliation queue", session.getId());
    }
}
