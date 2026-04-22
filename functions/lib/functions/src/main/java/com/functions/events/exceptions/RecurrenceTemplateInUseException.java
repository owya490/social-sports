package com.functions.events.exceptions;

import java.util.List;

/**
 * Thrown when a recurrence template cannot be deleted because it is still referenced by event collections or custom links.
 */
public class RecurrenceTemplateInUseException extends Exception {
    private final List<String> blockingEventCollectionIds;
    private final List<String> blockingCustomEventLinkPaths;

    public RecurrenceTemplateInUseException(String message, List<String> blockingEventCollectionIds,
            List<String> blockingCustomEventLinkPaths) {
        super(message);
        this.blockingEventCollectionIds = blockingEventCollectionIds;
        this.blockingCustomEventLinkPaths = blockingCustomEventLinkPaths;
    }

    public List<String> getBlockingEventCollectionIds() {
        return blockingEventCollectionIds;
    }

    public List<String> getBlockingCustomEventLinkPaths() {
        return blockingCustomEventLinkPaths;
    }
}
