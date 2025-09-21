package com.functions.fulfilment.services;

import com.functions.events.models.EventData;
import com.functions.events.repositories.EventsRepository;
import com.functions.forms.models.FormResponse;
import com.functions.forms.repositories.FormsRepository;
import com.functions.forms.services.FormsUtils;
import com.functions.fulfilment.models.*;
import com.functions.fulfilment.models.responses.GetFulfilmentEntityInfoResponse;
import com.functions.fulfilment.models.responses.GetFulfilmentSessionInfoResponse;
import com.functions.fulfilment.models.responses.GetNextFulfilmentEntityResponse;
import com.functions.fulfilment.models.responses.GetPrevFulfilmentEntityResponse;
import com.functions.fulfilment.repositories.FulfilmentSessionRepository;
import com.functions.stripe.services.StripeService;
import com.functions.utils.UrlUtils;
import com.google.cloud.Timestamp;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.AbstractMap.SimpleEntry;
import java.util.*;
import java.util.concurrent.TimeUnit;

public class FulfilmentService {
    private static final Logger logger = LoggerFactory.getLogger((FulfilmentService.class));
    private static final int CLEANUP_CUTOFF_MINUTES = 30;

    /**
     * Cleanup fulfilment sessions older than the default cutoff minutes.
     *
     * @return number of sessions attempted to delete (same behavior as before)
     */
    public static int cleanupOldFulfilmentSessions() throws Exception {
        return cleanupOldFulfilmentSessions(CLEANUP_CUTOFF_MINUTES);
    }

    /**
     * Cleanup fulfilment sessions older than the specified cutoff in minutes.
     *
     * @param cutoffMinutes minutes threshold
     * @return number of sessions attempted to delete
     * @throws Exception when listing old sessions fails
     */
    public static int cleanupOldFulfilmentSessions(int cutoffMinutes) throws Exception {
        long nowSeconds = Instant.now().getEpochSecond();
        long cutoffSeconds = nowSeconds - TimeUnit.MINUTES.toSeconds(cutoffMinutes);
        Timestamp cutoff = Timestamp.ofTimeSecondsAndNanos(cutoffSeconds, 0);

        int deleted = 0;
        try {
            List<String> oldSessionIds =
                    FulfilmentSessionRepository.listFulfilmentSessionIdsOlderThan(cutoff);
            for (String id : oldSessionIds) {
                try {
                    deleteFulfilmentSession(id);
                    deleted++;
                } catch (Exception e) {
                    logger.error(
                            "[FulfilmentService] Failed to delete fulfilment session {} during cleanup",
                            id, e);
                }
            }
            return deleted;
        } catch (Exception e) {
            logger.error("[FulfilmentService] Error during cleanup of old fulfilment sessions", e);
            throw e;
        }
    }

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
            List<SimpleEntry<String, FulfilmentEntity>> fulfilmentEntities =
                    constructCheckoutFulfilmentEntities(eventId, eventData, numTickets,
                            fulfilmentSessionId);

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
            String eventId, EventData eventData, Integer numTickets, String fulfilmentSessionId) {
        // Pair of FulfilmentEntityId and FulfilmentEntity
        List<SimpleEntry<String, FulfilmentEntity>> fulfilmentEntities = new ArrayList<>();

        List<FulfilmentEntity> tempEntities = new ArrayList<>();

        // 1. FORMS entities - one for each ticket
        try {
            Optional<String> formId = FormsUtils.getFormIdByEventId(eventId);
            if (formId.isPresent()) {
                for (int i = 0; i < numTickets; i++) {
                    tempEntities.add(
                            FormsFulfilmentEntity.builder().formId(formId.get()).eventId(eventId)
                                    .formResponseId(null)
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

        String endFulfilmentEntityId = getEndFulfilmentEntityId(eventId, tempEntities, entityIds);

        // TODO: simplify this piece of code once we modularise stripe checkout python logic
        for (int i = 0; i < tempEntities.size(); i++) {
            FulfilmentEntity entity = tempEntities.get(i);
            String entityId = entityIds.get(i);

            if (entity.getType() == FulfilmentEntityType.STRIPE) {
                // For STRIPE entity, set success URL to point to next entity
                String nextEntityId = (i + 1 < entityIds.size()) ? entityIds.get(i + 1) : null;

                String prevEntityId = (i - 1 >= 0) ? entityIds.get(i - 1) : null;
                String cancelUrl = prevEntityId != null
                        ? UrlUtils
                        .getUrlWithCurrentEnvironment(String.format("/fulfilment/%s/%s",
                                fulfilmentSessionId, prevEntityId))
                        .orElse("https://www.sportshub.net.au/dashboard")
                        : "https://sportshub.net.au/dashboard";

                String stripeCheckoutLink = StripeService.getStripeCheckoutFromEventId(eventId,
                        eventData.getIsPrivate(), numTickets, Optional.empty(), Optional.of(cancelUrl),
                        fulfilmentSessionId, endFulfilmentEntityId);

                logger.info("Created Stripe checkout link for event ID {}: {}", eventId, stripeCheckoutLink);
                entity = StripeFulfilmentEntity.builder().url(stripeCheckoutLink)
                        .type(FulfilmentEntityType.STRIPE).build();
                fulfilmentEntities.add(new SimpleEntry<>(entityId, entity));
            } else {
                fulfilmentEntities.add(new SimpleEntry<>(entityId, entity));
            }
        }

        return fulfilmentEntities;
    }

    private static String getEndFulfilmentEntityId(String eventId,
                                                   List<FulfilmentEntity> tempEntities, List<String> entityIds) {
        int endEntityIndex = -1;
        for (int i = 0; i < tempEntities.size(); i++) {
            if (tempEntities.get(i).getType() == FulfilmentEntityType.END) {
                endEntityIndex = i;
                break;
            }
        }
        if (endEntityIndex == -1) {
            throw new RuntimeException("Invalid END entity found index: " + endEntityIndex
                    + " for fulfilment entities in checkout fulfilment session for eventID: "
                    + eventId);
        }
        return entityIds.get(endEntityIndex);
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

    private static void copyTempFormResponsesToSubmitted(FulfilmentSession fulfilmentSession) {
        try {
            logger.info(
                    "[FulfilmentService] Copying temporary form responses to submitted for session ID: {}",
                    fulfilmentSession.getId());

            // Loop through all fulfilment entities in the session
            for (String entityId : fulfilmentSession.getFulfilmentEntityIds()) {
                FulfilmentEntity entity = fulfilmentSession.getFulfilmentEntityMap().get(entityId);
                if (entity == null || entity.getType() != FulfilmentEntityType.FORMS) {
                    continue; // Only process FORMS entities
                }

                FormsFulfilmentEntity formsEntity = (FormsFulfilmentEntity) entity;
                FormsUtils.copyTempFormResponseToSubmitted(formsEntity.getFormId(),
                        formsEntity.getEventId(), formsEntity.getFormResponseId());

                logger.info("Copied temporary form response to submitted for entity ID: {}, {}",
                        entityId, entity);
            }
        } catch (Exception e) {
            logger.error("Failed to copy temporary form responses to submitted for session ID: {}",
                    fulfilmentSession.getId(), e);
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
                logger.error("getPrevFulfilmentEntity: Invalid current index: {} for fulfilment session ID: {}",
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

            // Ensure the current fulfilment entity is completed before proceeding
            if (completedFulfilmentEntity(fulfilmentSession.getFulfilmentEntityMap().get(currentEntityId))) {
                logger.info("Current fulfilment entity is completed: {}", currentEntityId);
            } else {
                logger.error(
                        "Attempting to get next fulfilment entity but current fulfilment entity is not completed: {}",
                        currentEntityId);
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

    private static boolean completedFulfilmentEntity(FulfilmentEntity entity) {
        if (entity == null || entity.getType() == null) {
            return false;
        }

        if (entity.getType() == FulfilmentEntityType.FORMS) {
            FormsFulfilmentEntity formsEntity = (FormsFulfilmentEntity) entity;
            Optional<FormResponse> maybeFormResponse = FormsRepository.getFormResponseById(formsEntity.getFormId(),
                    formsEntity.getEventId(),
                    formsEntity.getFormResponseId());
            if (maybeFormResponse.isEmpty()) {
                logger.info("Form response not found for form ID: {}, event ID: {}, response ID: {}",
                        formsEntity.getFormId(), formsEntity.getEventId(), formsEntity.getFormResponseId());
                return false;
            }

            FormResponse formResponse = maybeFormResponse.get();
            return FormsUtils.isFormResponseComplete(formResponse);
        }
        return true;
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
            logger.error("Failed to retrieve fulfilment session for ID: {}", fulfilmentSessionId,
                    e);
            return Optional.empty();
        }
    }

    /**
     * Helper method to get URL from different entity types since not all entities have URLs.
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

    public static void deleteFulfilmentSession(String fulfilmentSessionId) {
        try {
            deleteTempFormResponsesForFulfilmentSession(fulfilmentSessionId);
            FulfilmentSessionRepository.deleteFulfilmentSession(fulfilmentSessionId);
            logger.info("Fulfilment session deleted successfully for ID: {}", fulfilmentSessionId);
        } catch (Exception e) {
            logger.error("Failed to delete fulfilment session for ID: {}", fulfilmentSessionId, e);
        }
    }

    /**
     * This function assumes that all form responses in a non-completed fulfilment session are
     * temporary.
     */
    private static void deleteTempFormResponsesForFulfilmentSession(String fulfilmentSessionId) {
        try {
            Optional<FulfilmentSession> maybeFulfilmentSession =
                    getFulfilmentSessionById(fulfilmentSessionId);
            if (maybeFulfilmentSession.isEmpty()) {
                logger.warn("No fulfilment session found for ID: {}", fulfilmentSessionId);
                return;
            }

            FulfilmentSession fulfilmentSession = maybeFulfilmentSession.get();
            Map<String, FulfilmentEntity> fulfilmentEntityMap = fulfilmentSession.getFulfilmentEntityMap();

            for (FulfilmentEntity entity : fulfilmentEntityMap.values()) {
                if (entity instanceof FormsFulfilmentEntity formsEntity) {
                    if (formsEntity.getFormResponseId() != null) {
                        FormsRepository.deleteTempFormResponse(formsEntity.getFormId(),
                                formsEntity.getEventId(), formsEntity.getFormResponseId());
                        logger.info(
                                "Deleted temporary form response for form ID: {}, event ID: {}, form response ID: {}, in fulfilment session: {}",
                                formsEntity.getFormId(), formsEntity.getEventId(),
                                formsEntity.getFormResponseId(), fulfilmentSessionId);
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Failed to delete temporary form responses for fulfilment session ID: {}",
                    fulfilmentSessionId, e);
        }
    }

    public static Optional<GetFulfilmentEntityInfoResponse> getFulfilmentEntityInfo(
            String fulfilmentSessionId, String fulfilmentEntityId) {
        try {
            Optional<FulfilmentSession> maybeFulfilmentSession =
                    getFulfilmentSessionById(fulfilmentSessionId);
            if (maybeFulfilmentSession.isEmpty()) {
                return Optional.empty();
            }

            FulfilmentSession fulfilmentSession = maybeFulfilmentSession.get();
            Map<String, FulfilmentEntity> fulfilmentEntityMap =
                    fulfilmentSession.getFulfilmentEntityMap();

            FulfilmentEntity entity = fulfilmentEntityMap.get(fulfilmentEntityId);
            if (entity == null) {
                logger.error("Fulfilment entity not found for ID: {} in session: {}", fulfilmentEntityId,
                        fulfilmentSessionId);
                return Optional.empty();
            }

            logger.info("Retrieved fulfilment entity info for ID: {} in session: {}; entity: {}", fulfilmentEntityId,
                    fulfilmentSessionId, entity);

            return Optional.of(new GetFulfilmentEntityInfoResponse(
                    entity.getType(),
                    getEntityUrl(entity),
                    maybeFulfilmentSession.get().getEventData().getEventId(),
                    maybeFulfilmentSession.get().getEventData().getFormId(),
                    entity.getType() == FulfilmentEntityType.FORMS
                            ? ((FormsFulfilmentEntity) entity).getFormResponseId()
                            : null));
        } catch (Exception e) {
            logger.error("Failed to get fulfilment entity info for session ID: {} and entity ID: {}",
                    fulfilmentSessionId, fulfilmentEntityId, e);
            return Optional.empty();
        }
    }

    /**
     * Retrieves fulfilment session information including entity types and current
     * position.
     *
     * @param fulfilmentSessionId       The ID of the fulfilment session
     * @param currentFulfilmentEntityId The current fulfilment entity ID (optional)
     * @return Optional containing the response with the list of fulfilment entity
     * types and current index, or empty if the session is not found
     */
    public static Optional<GetFulfilmentSessionInfoResponse> getFulfilmentSessionInfo(
            String fulfilmentSessionId, String currentFulfilmentEntityId) {
        try {
            Optional<FulfilmentSession> maybeFulfilmentSession = getFulfilmentSessionById(fulfilmentSessionId);
            if (maybeFulfilmentSession.isEmpty()) {
                logger.error("Fulfilment session not found for ID: {}", fulfilmentSessionId);
                return Optional.empty();
            }

            FulfilmentSession fulfilmentSession = maybeFulfilmentSession.get();
            List<String> fulfilmentEntityIds = fulfilmentSession.getFulfilmentEntityIds();
            Map<String, FulfilmentEntity> fulfilmentEntityMap = fulfilmentSession.getFulfilmentEntityMap();

            // Extract the types in the same order as the entity IDs
            List<FulfilmentEntityType> fulfilmentEntityTypes = fulfilmentEntityIds.stream()
                    .map(entityId -> {
                        FulfilmentEntity entity = fulfilmentEntityMap.get(entityId);
                        return entity != null ? entity.getType() : null;
                    })
                    .filter(type -> type != null) // Filter out any null types
                    .collect(java.util.stream.Collectors.toList());

            // Calculate current index if current entity ID is provided
            Integer currentEntityIndex = null;
            if (currentFulfilmentEntityId != null && !currentFulfilmentEntityId.isEmpty()) {
                int index = fulfilmentEntityIds.indexOf(currentFulfilmentEntityId);
                if (index != -1) {
                    currentEntityIndex = index;
                    logger.info("Current entity index for session {}: {}", fulfilmentSessionId, currentEntityIndex);
                } else {
                    logger.warn("Current entity ID {} not found in session {}", currentFulfilmentEntityId,
                            fulfilmentSessionId);
                }
            }

            logger.info("Retrieved {} fulfilment entity types for session: {}",
                    fulfilmentEntityTypes.size(), fulfilmentSessionId);

            return Optional.of(new GetFulfilmentSessionInfoResponse(fulfilmentEntityTypes, currentEntityIndex,
                    fulfilmentSession.getFulfilmentSessionStartTime()));
        } catch (Exception e) {
            logger.error("Failed to get fulfilment session info for session ID: {}", fulfilmentSessionId, e);
            return Optional.empty();
        }
    }

    /**
     * @param fulfilmentSessionId
     * @param fulfilmentEntityId
     * @param formResponseId
     * @return `true` if the fulfilment entity was updated successfully, `false`
     * otherwise
     */
    public static boolean updateFulfilmentEntityWithFormResponseId(String fulfilmentSessionId,
                                                                   String fulfilmentEntityId,
                                                                   String formResponseId) {
        try {
            Optional<FulfilmentSession> maybeFulfilmentSession =
                    getFulfilmentSessionById(fulfilmentSessionId);
            if (maybeFulfilmentSession.isEmpty()) {
                logger.error("Fulfilment session not found for ID: {}", fulfilmentSessionId);
                return false;
            }

            FulfilmentSession fulfilmentSession = maybeFulfilmentSession.get();
            Map<String, FulfilmentEntity> fulfilmentEntityMap =
                    fulfilmentSession.getFulfilmentEntityMap();

            FulfilmentEntity entity = fulfilmentEntityMap.get(fulfilmentEntityId);
            if (entity == null || !(entity instanceof FormsFulfilmentEntity)) {
                logger.error("Invalid fulfilment entity ID: {} for session: {}", fulfilmentEntityId,
                        fulfilmentSessionId);
                return false;
            }

            ((FormsFulfilmentEntity) entity).setFormResponseId(formResponseId);
            fulfilmentEntityMap.put(fulfilmentEntityId, entity);
            fulfilmentSession.setFulfilmentEntityMap(fulfilmentEntityMap);
            FulfilmentSessionRepository.updateFulfilmentSession(fulfilmentSessionId,
                    fulfilmentSession);
            logger.info(
                    "Fulfilment session updated successfully for ID: {} with form response ID: {} for entity ID: {}",
                    fulfilmentSessionId, formResponseId, fulfilmentEntityId);
            return true;
        } catch (Exception e) {
            logger.error(
                    "Failed to update fulfilment entity with form response ID for session ID: {} and entity ID: {}",
                    fulfilmentSessionId, fulfilmentEntityId, e);
            return false;
        }
    }

    /**
     * Completes a fulfilment session. The entity ID passed in MUST correspond to an `END`
     * fulfilment entity type.
     *
     * @param fulfilmentSessionId The ID of the fulfilment session to complete
     * @param fulfilmentEntityId  Should be the fulfilment entity ID of an `END` fulfilment entity;
     *                            otherwise, we will fail the completion
     * @return true if the completion was successful, false otherwise
     */
    public static boolean completeFulfilmentSession(String fulfilmentSessionId,
                                                    String fulfilmentEntityId) {
        try {
            Optional<FulfilmentSession> maybeFulfilmentSession =
                    getFulfilmentSessionById(fulfilmentSessionId);
            if (maybeFulfilmentSession.isEmpty()) {
                logger.error("Fulfilment session not found for ID: {}", fulfilmentSessionId);
                return false;
            }

            FulfilmentSession fulfilmentSession = maybeFulfilmentSession.get();
            Map<String, FulfilmentEntity> fulfilmentEntityMap = fulfilmentSession.getFulfilmentEntityMap();

            FulfilmentEntity entity = fulfilmentEntityMap.get(fulfilmentEntityId);
            if (entity == null || entity.getType() != FulfilmentEntityType.END) {
                logger.error("Invalid fulfilment entity ID: {} for entity: {} in session: {}", fulfilmentEntityId,
                        entity,
                        fulfilmentSessionId);
                return false;
            }

            copyTempFormResponsesToSubmitted(fulfilmentSession);
            deleteFulfilmentSession(fulfilmentSessionId);

            logger.info("Fulfilment session completed successfully for ID: {} and entity ID: {}",
                    fulfilmentSessionId, fulfilmentEntityId);
            return true;
        } catch (Exception e) {
            logger.error("Failed to complete fulfilment session for ID: {} and entity ID: {}",
                    fulfilmentSessionId, fulfilmentEntityId, e);
            return false;
        }
    }
}
