package com.functions.fulfilment.services;

import java.util.AbstractMap.SimpleEntry;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.events.models.EventData;
import com.functions.events.repositories.EventsRepository;
import com.functions.forms.services.FormsService;
import com.functions.fulfilment.models.CheckoutFulfilmentSession;
import com.functions.fulfilment.models.EndFulfilmentEntity;
import com.functions.fulfilment.models.FormsFulfilmentEntity;
import com.functions.fulfilment.models.FulfilmentEntity;
import com.functions.fulfilment.models.FulfilmentEntityType;
import com.functions.fulfilment.models.FulfilmentSession;
import com.functions.fulfilment.models.StripeFulfilmentEntity;
import com.functions.fulfilment.models.responses.GetFulfilmentEntityInfoResponse;
import com.functions.fulfilment.models.responses.GetNextFulfilmentEntityResponse;
import com.functions.fulfilment.models.responses.GetPrevFulfilmentEntityResponse;
import com.functions.fulfilment.repositories.FulfilmentSessionRepository;
import com.functions.stripe.services.StripeService;
import com.functions.utils.UrlUtils;
import com.google.cloud.Timestamp;

public class FulfilmentService {
    private static final Logger logger = LoggerFactory.getLogger((FulfilmentService.class));

    /**
     * Initializes a checkout fulfilment session for the given event ID.
     */
    public static Optional<String> initCheckoutFulfilmentSession(String eventId,
            Integer numTickets) {
        try {
            // TODO: optimistically reserve tickets and at the current price using a
            // transaction

            String fulfilmentSessionId = UUID.randomUUID().toString();
            Optional<EventData> maybeEventData = EventsRepository.getEventById(eventId);
            if (maybeEventData.isEmpty()) {
                logger.error("Failed to find event data for event ID: {}", eventId);
                throw new Exception("Failed to find event data for event ID: " + eventId);
            }

            EventData eventData = maybeEventData.get();
            List<SimpleEntry<String, FulfilmentEntity>> fulfilmentEntities = constructCheckoutFulfilmentEntities(
                    eventId,
                    eventData, numTickets, fulfilmentSessionId);

            return FulfilmentService.createFulfilmentSession(fulfilmentSessionId, eventId,
                    numTickets, fulfilmentEntities).map(sessionId -> {
                        if (sessionId.isEmpty()) {
                            throw new RuntimeException(
                                    "Failed to create fulfilment session for event ID: " + eventId);
                        }
                        return sessionId;
                    });
        } catch (Exception e) {
            logger.error("Failed to init checkout fulfilment session: {}", eventId, e);
        }
        return Optional.empty();
    }

    private static List<SimpleEntry<String, FulfilmentEntity>> constructCheckoutFulfilmentEntities(
            String eventId,
            EventData eventData, Integer numTickets, String fulfilmentSessionId) {
        // Pair of FulfilmentEntityId and FulfilmentEntity
        List<SimpleEntry<String, FulfilmentEntity>> fulfilmentEntities = new ArrayList<>();

        List<FulfilmentEntity> tempEntities = new ArrayList<>();

        // 1. FORMS entities - one for each ticket
        try {
            Optional<String> formId = FormsService.getFormIdByEventId(eventId);
            if (formId.isPresent()) {
                for (int i = 0; i < numTickets; i++) {
                    tempEntities.add(FormsFulfilmentEntity.builder().formId(formId.get())
                            .type(FulfilmentEntityType.FORMS).build());
                }
            }
        } catch (Exception e) {
            logger.error("[FulfilmentService] Error constructing FORMS entities for event ID: {}", eventId, e);
            throw new RuntimeException(
                    "[FulfilmentService] Failed to construct FORMS entities for event ID: " + eventId, e);
        }

        // 2. STRIPE entity (will be updated with correct success URL later)
        tempEntities.add(StripeFulfilmentEntity.builder().url("") // Placeholder URL
                .type(FulfilmentEntityType.STRIPE).build());

        // 3. END entity
        tempEntities.add(EndFulfilmentEntity.builder()
                .url(UrlUtils
                        .getUrlWithCurrentEnvironment(String.format("/event/success/%s", eventId))
                        .orElse("https://sportshub.net.au/dashboard"))
                .type(FulfilmentEntityType.END).build());

        List<String> entityIds = new ArrayList<>();
        for (int i = 0; i < tempEntities.size(); i++) {
            entityIds.add(UUID.randomUUID().toString());
        }

        // TODO: simplify this piece of code once we modularise stripe checkout python
        // logic
        for (int i = 0; i < tempEntities.size(); i++) {
            FulfilmentEntity entity = tempEntities.get(i);
            String entityId = entityIds.get(i);

            if (entity.getType() == FulfilmentEntityType.STRIPE) {
                // For STRIPE entity, set success URL to point to next entity
                String nextEntityId = (i + 1 < entityIds.size()) ? entityIds.get(i + 1) : null;
                String successUrl = UrlUtils.getUrlWithCurrentEnvironment(
                        String.format("/fulfilment/%s/%s", fulfilmentSessionId, nextEntityId))
                        .orElse("https://sportshub.net.au/dashboard");

                Optional<String> stripeCheckoutLink = StripeService.getStripeCheckoutFromEventId(eventId,
                        eventData.getIsPrivate(), numTickets, Optional.of(successUrl), fulfilmentSessionId);

                if (stripeCheckoutLink.isPresent()) {
                    entity = StripeFulfilmentEntity.builder().url(stripeCheckoutLink.get())
                            .type(FulfilmentEntityType.STRIPE).build();
                    fulfilmentEntities.add(new SimpleEntry<>(entityId, entity));
                }
            } else {
                fulfilmentEntities.add(new SimpleEntry<>(entityId, entity));
            }
        }

        return fulfilmentEntities;
    }

    private static Optional<String> createFulfilmentSession(String sessionId, String eventId,
            Integer numTickets, List<SimpleEntry<String, FulfilmentEntity>> fulfilmentEntities) {
        try {
            // Convert list to map and order
            Map<String, FulfilmentEntity> entityMap = new HashMap<>();
            List<String> entityOrder = new ArrayList<>();

            for (SimpleEntry<String, FulfilmentEntity> entry : fulfilmentEntities) {
                String entityId = entry.getKey();
                FulfilmentEntity entity = entry.getValue();
                entityMap.put(entityId, entity);
                entityOrder.add(entityId);
            }

            CheckoutFulfilmentSession session = CheckoutFulfilmentSession.builder()
                    .fulfilmentSessionStartTime(Timestamp.now())
                    .eventData(EventsRepository.getEventById(eventId)
                            .orElseThrow(() -> new Exception("Event not found for ID: " + eventId)))
                    .fulfilmentEntityMap(entityMap).fulfilmentEntityIds(entityOrder)
                    .numTickets(numTickets)
                    .build();

            String fulfilmentSessionId = FulfilmentSessionRepository.createFulfilmentSession(sessionId, session);

            logger.info("Fulfilment session created with ID: {} for event ID: {}",
                    fulfilmentSessionId, eventId);
            return Optional.of(fulfilmentSessionId);
        } catch (Exception e) {
            logger.error("Failed to create fulfilment session for event ID: {}", eventId, e);
            return Optional.empty();
        }
    }

    private static Optional<GetNextFulfilmentEntityResponse> getNextFulfilmentEntity(
            String fulfilmentSessionId, int currentIndex) {
        try {
            logger.info("[FulfilmentService] Getting next fulfilment entity for session ID: {} at index: {}",
                    fulfilmentSessionId, currentIndex);
            Optional<FulfilmentSession> maybeFulfilmentSession = getFulfilmentSessionById(fulfilmentSessionId);
            if (maybeFulfilmentSession.isEmpty()) {
                return Optional.empty();
            }

            FulfilmentSession fulfilmentSession = maybeFulfilmentSession.get();
            List<String> fulfilmentEntityIds = fulfilmentSession.getFulfilmentEntityIds();

            // Validate current index
            if (currentIndex < -1 || currentIndex >= fulfilmentEntityIds.size()) {
                logger.error("Invalid current index: {} for fulfilment session ID: {}",
                        currentIndex, fulfilmentSessionId);
                return Optional.empty();
            }

            // Calculate next index
            int nextIndex = currentIndex + 1;
            if (nextIndex >= fulfilmentEntityIds.size()) {
                logger.info(
                        "Reached end of fulfilment workflow for session ID: {} because next index {} is out of bounds of number of entities {}",
                        fulfilmentSessionId, nextIndex, fulfilmentEntityIds.size());
                return Optional.empty();
            }

            // Get next entity
            String nextEntityId = fulfilmentEntityIds.get(nextIndex);

            logger.info("[FulfilmentService] Next fulfilment entity found: {}",
                    nextEntityId);

            return Optional.of(new GetNextFulfilmentEntityResponse(
                    nextEntityId));
        } catch (Exception e) {
            logger.error("Failed to get next fulfilment entity for session ID: {}",
                    fulfilmentSessionId, e);
            return Optional.empty();
        }
    }

    private static Optional<GetPrevFulfilmentEntityResponse> getPrevFulfilmentEntity(
            String fulfilmentSessionId, int currentIndex) {
        try {
            logger.info("[FulfilmentService] Getting previous fulfilment entity for session ID: {} at index: {}",
                    fulfilmentSessionId, currentIndex);
            Optional<FulfilmentSession> maybeFulfilmentSession = getFulfilmentSessionById(fulfilmentSessionId);
            if (maybeFulfilmentSession.isEmpty()) {
                return Optional.empty();
            }

            FulfilmentSession fulfilmentSession = maybeFulfilmentSession.get();
            List<String> fulfilmentEntityIds = fulfilmentSession.getFulfilmentEntityIds();

            // Validate current index
            if (currentIndex < 0 || currentIndex >= fulfilmentEntityIds.size()) {
                logger.error("Invalid current index: {} for fulfilment session ID: {}",
                        currentIndex, fulfilmentSessionId);
                return Optional.empty();
            }

            // Calculate previous index
            int prevIndex = currentIndex - 1;
            if (prevIndex < 0) {
                logger.info(
                        "Reached beginning of fulfilment workflow for session ID: {} because previous index {} is out of bounds",
                        fulfilmentSessionId, prevIndex);
                return Optional.empty();
            }

            // Get previous entity
            String prevEntityId = fulfilmentEntityIds.get(prevIndex);

            logger.info("[FulfilmentService] Previous fulfilment entity found for entityId: {}",
                    prevEntityId);

            return Optional.of(new GetPrevFulfilmentEntityResponse(
                    prevEntityId));
        } catch (Exception e) {
            logger.error("Failed to get previous fulfilment entity for session ID: {}",
                    fulfilmentSessionId, e);
            return Optional.empty();
        }
    }

    /**
     * Gets the first fulfilment entity to start the workflow. This is a convenience
     * method that starts from index -1 (before the first entity).
     */
    public static Optional<GetNextFulfilmentEntityResponse> getFirstFulfilmentEntity(
            String fulfilmentSessionId) {
        return getNextFulfilmentEntity(fulfilmentSessionId, -1);
    }

    /**
     * Gets the next fulfilment entity after the specified current entity ID.
     * If currentEntityId is null or empty, returns the first entity.
     */
    public static Optional<GetNextFulfilmentEntityResponse> getNextFulfilmentEntityByCurrentId(
            String fulfilmentSessionId, String currentEntityId) {
        try {
            logger.info("[FulfilmentService] Getting next fulfilment entity for session: {} with current entity ID: {}",
                    fulfilmentSessionId, currentEntityId);
            // If no current entity ID provided, return the first entity
            if (currentEntityId == null || currentEntityId.isEmpty()) {
                return getFirstFulfilmentEntity(fulfilmentSessionId);
            }

            // Get session and find current entity index
            Optional<FulfilmentSession> maybeFulfilmentSession = getFulfilmentSessionById(fulfilmentSessionId);
            if (maybeFulfilmentSession.isEmpty()) {
                return Optional.empty();
            }

            FulfilmentSession fulfilmentSession = maybeFulfilmentSession.get();
            List<String> fulfilmentEntityIds = fulfilmentSession.getFulfilmentEntityIds();

            // Find the index of the current entity
            int currentIndex = fulfilmentEntityIds.indexOf(currentEntityId);
            if (currentIndex == -1) {
                logger.error("Current entity ID not found in session: {} -> {}",
                        fulfilmentSessionId, currentEntityId);
                return Optional.empty();
            }

            // Get the next entity
            return getNextFulfilmentEntity(fulfilmentSessionId, currentIndex);
        } catch (Exception e) {
            logger.error("Failed to get next fulfilment entity by current ID for session: {}",
                    fulfilmentSessionId, e);
            return Optional.empty();
        }
    }

    /**
     * Gets the previous fulfilment entity before the specified current entity ID.
     * If currentEntityId is null or empty, returns empty (no previous entity).
     */
    public static Optional<GetPrevFulfilmentEntityResponse> getPrevFulfilmentEntityByCurrentId(
            String fulfilmentSessionId, String currentEntityId) {
        try {
            logger.info(
                    "[FulfilmentService] Getting previous fulfilment entity for session: {} with current entity ID: {}",
                    fulfilmentSessionId, currentEntityId);

            // If no current entity ID provided, there's no previous entity
            if (currentEntityId == null || currentEntityId.isEmpty()) {
                logger.info("No current entity ID provided, no previous entity available");
                return Optional.empty();
            }

            // Get session and find current entity index
            Optional<FulfilmentSession> maybeFulfilmentSession = getFulfilmentSessionById(fulfilmentSessionId);
            if (maybeFulfilmentSession.isEmpty()) {
                return Optional.empty();
            }

            FulfilmentSession fulfilmentSession = maybeFulfilmentSession.get();
            List<String> fulfilmentEntityIds = fulfilmentSession.getFulfilmentEntityIds();

            // Find the index of the current entity
            int currentIndex = fulfilmentEntityIds.indexOf(currentEntityId);
            if (currentIndex == -1) {
                logger.error("Current entity ID not found in session: {} -> {}",
                        fulfilmentSessionId, currentEntityId);
                return Optional.empty();
            }

            // Get the previous entity
            return getPrevFulfilmentEntity(fulfilmentSessionId, currentIndex);
        } catch (Exception e) {
            logger.error("Failed to get previous fulfilment entity by current ID for session: {}",
                    fulfilmentSessionId, e);
            return Optional.empty();
        }
    }

    /**
     * Helper method to retrieve and validate a fulfilment session by ID.
     */
    private static Optional<FulfilmentSession> getFulfilmentSessionById(String fulfilmentSessionId) {
        try {
            Optional<FulfilmentSession> maybeFulfilmentSession = FulfilmentSessionRepository
                    .getFulfilmentSession(fulfilmentSessionId);
            if (maybeFulfilmentSession.isEmpty()) {
                logger.error("Fulfilment session not found for ID: {}", fulfilmentSessionId);
            }
            return maybeFulfilmentSession;
        } catch (Exception e) {
            logger.error("Failed to retrieve fulfilment session for ID: {}", fulfilmentSessionId, e);
            return Optional.empty();
        }
    }

    /**
     * Helper method to get URL from different entity types since not all entities
     * have URLs.
     */
    private static String getEntityUrl(FulfilmentEntity entity) {
        switch (entity.getType()) {
            case STRIPE:
                return ((StripeFulfilmentEntity) entity).getUrl();
            case END:
                return ((EndFulfilmentEntity) entity).getUrl();
            case FORMS:
                // Forms entities don't have URLs, return null
                return null;
            default:
                logger.warn("Unknown entity type for URL retrieval: {}", entity.getType());
                return null;
        }
    }

    // TODO: clean up the fulfilment session after completion using this delete
    // method
    public static void deleteFulfilmentSession(String fulfilmentSessionId) {
        try {
            FulfilmentSessionRepository.deleteFulfilmentSession(fulfilmentSessionId);
            logger.info("Fulfilment session deleted successfully for ID: {}", fulfilmentSessionId);
        } catch (Exception e) {
            logger.error("Failed to delete fulfilment session for ID: {}", fulfilmentSessionId, e);
        }
    }

    public static Optional<GetFulfilmentEntityInfoResponse> getFulfilmentEntityInfo(
            String fulfilmentSessionId, String fulfilmentEntityId) {
        try {
            Optional<FulfilmentSession> maybeFulfilmentSession = getFulfilmentSessionById(fulfilmentSessionId);
            if (maybeFulfilmentSession.isEmpty()) {
                return Optional.empty();
            }

            FulfilmentSession fulfilmentSession = maybeFulfilmentSession.get();
            Map<String, FulfilmentEntity> fulfilmentEntityMap = fulfilmentSession.getFulfilmentEntityMap();

            FulfilmentEntity entity = fulfilmentEntityMap.get(fulfilmentEntityId);
            if (entity == null) {
                logger.error("Fulfilment entity not found for ID: {} in session: {}", fulfilmentEntityId,
                        fulfilmentSessionId);
                return Optional.empty();
            }

            return Optional.of(new GetFulfilmentEntityInfoResponse(
                    entity.getType(),
                    getEntityUrl(entity)));
        } catch (Exception e) {
            logger.error("Failed to get fulfilment entity info for session ID: {} and entity ID: {}",
                    fulfilmentSessionId, fulfilmentEntityId, e);
            return Optional.empty();
        }
    }
}
