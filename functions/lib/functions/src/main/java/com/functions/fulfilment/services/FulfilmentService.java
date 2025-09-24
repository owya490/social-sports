package com.functions.fulfilment.services;

import com.functions.events.models.EventData;
import com.functions.events.repositories.EventsRepository;
import com.functions.forms.models.FormResponse;
import com.functions.forms.repositories.FormsRepository;
import com.functions.forms.services.FormsUtils;
import com.functions.fulfilment.models.CheckoutFulfilmentSession;
import com.functions.fulfilment.models.EndFulfilmentEntity;
import com.functions.fulfilment.models.FormsFulfilmentEntity;
import com.functions.fulfilment.models.FulfilmentEntity;
import com.functions.fulfilment.models.FulfilmentEntityType;
import com.functions.fulfilment.models.FulfilmentSession;
import com.functions.fulfilment.models.StripeFulfilmentEntity;
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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
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
        logger.info("Starting cleanup of old fulfilment sessions with cutoff: {} minutes",
                cutoffMinutes);

        long nowSeconds = Instant.now().getEpochSecond();
        long cutoffSeconds = nowSeconds - TimeUnit.MINUTES.toSeconds(cutoffMinutes);
        Timestamp cutoff = Timestamp.ofTimeSecondsAndNanos(cutoffSeconds, 0);

        logger.debug("Cleanup cutoff timestamp: {}", cutoff);

        int deleted = 0;
        try {
            logger.debug("Listing old fulfilment sessions");
            List<String> oldSessionIds =
                    FulfilmentSessionRepository.listFulfilmentSessionIdsOlderThan(cutoff);
            logger.info("Found {} old fulfilment sessions to delete", oldSessionIds.size());

            for (String id : oldSessionIds) {
                logger.debug("Attempting to delete fulfilment session: {}", id);
                try {
                    deleteFulfilmentSession(id);
                    deleted++;
                    logger.debug("Successfully deleted fulfilment session: {}", id);
                } catch (Exception e) {
                    logger.error("Failed to delete fulfilment session {} during cleanup: {}", id,
                            e.getMessage(), e);
                }
            }

            logger.info("Cleanup completed: {} sessions deleted out of {} found", deleted,
                    oldSessionIds.size());
            return deleted;
        } catch (Exception e) {
            logger.error("Error during cleanup of old fulfilment sessions: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Initializes a checkout fulfilment session for the given event ID.
     */
    public static Optional<String> initCheckoutFulfilmentSession(String eventId,
            Integer numTickets) {
        logger.info("Initializing checkout fulfilment session: eventId={}, numTickets={}", eventId,
                numTickets);

        if (eventId == null || eventId.isEmpty()) {
            logger.error("Event ID is null or empty");
            return Optional.empty();
        }

        if (numTickets == null || numTickets <= 0) {
            logger.error("Invalid number of tickets: {}", numTickets);
            return Optional.empty();
        }

        try {
            String fulfilmentSessionId = UUID.randomUUID().toString();
            logger.debug("Generated fulfilment session ID: {}", fulfilmentSessionId);

            logger.debug("Retrieving event data for eventId: {}", eventId);
            Optional<EventData> maybeEventData = EventsRepository.getEventById(eventId);
            if (maybeEventData.isEmpty()) {
                logger.error("Event not found during fulfilment session init - eventId: {}",
                        eventId);
                throw new Exception("Failed to find event data for event ID: " + eventId);
            }

            EventData eventData = maybeEventData.get();
            logger.debug("Retrieved event data - eventId: {}, name: {}, price: {}, isPrivate: {}",
                    eventId, eventData.getName(), eventData.getPrice(), eventData.getIsPrivate());

            logger.debug("Constructing checkout fulfilment entities - eventId: {}, numTickets: {}",
                    eventId, numTickets);
            List<SimpleEntry<String, FulfilmentEntity>> fulfilmentEntities =
                    constructCheckoutFulfilmentEntities(eventId, eventData, numTickets,
                            fulfilmentSessionId);

            logger.info("Created {} fulfilment entities for session: {}", fulfilmentEntities.size(),
                    fulfilmentSessionId);

            return FulfilmentService.createFulfilmentSession(fulfilmentSessionId, eventId,
                    numTickets, fulfilmentEntities).map(sessionId -> {
                        if (sessionId.isEmpty()) {
                            logger.error(
                                    "Empty session ID returned from createFulfilmentSession - eventId: {}",
                                    eventId);
                            throw new RuntimeException(
                                    "Failed to create fulfilment session for event ID: " + eventId);
                        }
                        logger.info(
                                "Successfully initialized checkout fulfilment session - sessionId: {}, eventId: {}, numTickets: {}",
                                sessionId, eventId, numTickets);
                        return sessionId;
                    });
        } catch (Exception e) {
            logger.error(
                    "Failed to init checkout fulfilment session for eventId: {}, numTickets: {}, error: {}",
                    eventId, numTickets, e.getMessage(), e);
        }
        return Optional.empty();
    }

    private static List<SimpleEntry<String, FulfilmentEntity>> constructCheckoutFulfilmentEntities(
            String eventId, EventData eventData, Integer numTickets, String fulfilmentSessionId) {
        logger.debug(
                "Constructing checkout fulfilment entities - eventId: {}, numTickets: {}, sessionId: {}",
                eventId, numTickets, fulfilmentSessionId);

        // Pair of FulfilmentEntityId and FulfilmentEntity
        List<SimpleEntry<String, FulfilmentEntity>> fulfilmentEntities = new ArrayList<>();
        List<FulfilmentEntity> tempEntities = new ArrayList<>();

        // 1. FORMS entities - one for each ticket
        try {
            logger.debug("Creating FORMS entities for {} tickets", numTickets);
            Optional<String> formId = FormsUtils.getFormIdByEventId(eventId);
            if (formId.isPresent()) {
                String formIdValue = formId.get();
                logger.debug("Event has associated form - eventId: {}, formId: {}", eventId,
                        formIdValue);
                for (int i = 0; i < numTickets; i++) {
                    FormsFulfilmentEntity entity =
                            FormsFulfilmentEntity.builder().formId(formIdValue).eventId(eventId)
                                    .formResponseId(null).type(FulfilmentEntityType.FORMS).build();
                    tempEntities.add(entity);
                    logger.debug("Created FORMS entity {} of {} - formId: {}", i + 1, numTickets,
                            formIdValue);
                }
                logger.info("Created {} FORMS entities for event: {}", numTickets, eventId);
            } else {
                logger.info(
                        "No form required for event - eventId: {}, proceeding without FORMS entities",
                        eventId);
            }
        } catch (Exception e) {
            logger.error("Error constructing FORMS entities - eventId: {}, numTickets: {}", eventId,
                    numTickets, e);
            throw new RuntimeException(
                    "Failed to construct FORMS entities for event ID: " + eventId, e);
        }

        // 2. STRIPE entity (will be updated with correct success URL later)
        logger.debug("Creating STRIPE payment entity");
        tempEntities.add(StripeFulfilmentEntity.builder().url("") // Placeholder URL - will be
                                                                  // populated with actual Stripe
                                                                  // checkout URL
                .type(FulfilmentEntityType.STRIPE).build());

        // 3. END entity
        logger.debug("Creating END completion entity");
        String endUrl =
                UrlUtils.getUrlWithCurrentEnvironment(String.format("/event/success/%s", eventId))
                        .orElse("https://sportshub.net.au/dashboard");
        logger.debug("Generated completion URL: {}", endUrl);

        tempEntities.add(
                EndFulfilmentEntity.builder().url(endUrl).type(FulfilmentEntityType.END).build());

        logger.info("Created {} fulfilment entities total - eventId: {}, entities: [{}]",
                tempEntities.size(), eventId, tempEntities.stream().map(e -> e.getType().toString())
                        .reduce((a, b) -> a + ", " + b).orElse(""));

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
                String successUrl = nextEntityId != null
                        ? UrlUtils
                                .getUrlWithCurrentEnvironment(String.format("/fulfilment/%s/%s",
                                        fulfilmentSessionId, nextEntityId))
                                .orElse("https://sportshub.net.au/dashboard")
                        : "https://sportshub.net.au/dashboard";

                String prevEntityId = (i - 1 >= 0) ? entityIds.get(i - 1) : null;
                String cancelUrl = prevEntityId != null
                        ? UrlUtils
                                .getUrlWithCurrentEnvironment(String.format("/fulfilment/%s/%s",
                                        fulfilmentSessionId, prevEntityId))
                                .orElse("https://sportshub.net.au/dashboard")
                        : "https://sportshub.net.au/dashboard";

                String stripeCheckoutLink = StripeService.getStripeCheckoutFromEventId(eventId,
                        eventData.getIsPrivate(), numTickets, Optional.of(successUrl),
                        Optional.of(cancelUrl), fulfilmentSessionId);

                logger.info("Created Stripe checkout link for event ID {}: {}", eventId,
                        stripeCheckoutLink);
                entity = StripeFulfilmentEntity.builder().url(stripeCheckoutLink)
                        .type(FulfilmentEntityType.STRIPE).build();
                fulfilmentEntities.add(new SimpleEntry<>(entityId, entity));
            } else {
                fulfilmentEntities.add(new SimpleEntry<>(entityId, entity));
            }
        }

        return fulfilmentEntities;
    }

    private static Optional<String> createFulfilmentSession(String sessionId, String eventId,
            Integer numTickets, List<SimpleEntry<String, FulfilmentEntity>> fulfilmentEntities) {
        logger.debug(
                "Creating fulfilment session - sessionId: {}, eventId: {}, numTickets: {}, entities: {}",
                sessionId, eventId, numTickets, fulfilmentEntities.size());

        try {
            // Convert list to map and order
            Map<String, FulfilmentEntity> entityMap = new HashMap<>();
            List<String> entityOrder = new ArrayList<>();

            for (SimpleEntry<String, FulfilmentEntity> entry : fulfilmentEntities) {
                String entityId = entry.getKey();
                FulfilmentEntity entity = entry.getValue();
                entityMap.put(entityId, entity);
                entityOrder.add(entityId);
                logger.debug("Added entity to session - entityId: {}, type: {}", entityId,
                        entity.getType());
            }

            logger.debug("Retrieving event data for session creation");
            CheckoutFulfilmentSession session = CheckoutFulfilmentSession.builder()
                    .fulfilmentSessionStartTime(Timestamp.now())
                    .eventData(EventsRepository.getEventById(eventId)
                            .orElseThrow(() -> new Exception("Event not found for ID: " + eventId)))
                    .fulfilmentEntityMap(entityMap).fulfilmentEntityIds(entityOrder)
                    .numTickets(numTickets).build();

            logger.debug("Persisting fulfilment session to repository");
            String fulfilmentSessionId =
                    FulfilmentSessionRepository.createFulfilmentSession(sessionId, session);

            logger.info(
                    "Successfully created fulfilment session - sessionId: {}, eventId: {}, numTickets: {}, entities: {}",
                    fulfilmentSessionId, eventId, numTickets, fulfilmentEntities.size());
            return Optional.of(fulfilmentSessionId);
        } catch (Exception e) {
            logger.error(
                    "Failed to create fulfilment session - sessionId: {}, eventId: {}, numTickets: {}",
                    sessionId, eventId, numTickets, e);
            return Optional.empty();
        }
    }

    private static Optional<GetNextFulfilmentEntityResponse> getNextFulfilmentEntity(
            String fulfilmentSessionId, int currentIndex) {
        logger.debug("Getting next fulfilment entity - sessionId: {}, currentIndex: {}",
                fulfilmentSessionId, currentIndex);

        try {
            Optional<FulfilmentSession> maybeFulfilmentSession =
                    getFulfilmentSessionById(fulfilmentSessionId);
            if (maybeFulfilmentSession.isEmpty()) {
                logger.warn("Fulfilment session not found - sessionId: {}", fulfilmentSessionId);
                return Optional.empty();
            }

            FulfilmentSession fulfilmentSession = maybeFulfilmentSession.get();
            List<String> fulfilmentEntityIds = fulfilmentSession.getFulfilmentEntityIds();

            logger.debug("Session has {} entities total", fulfilmentEntityIds.size());

            // Validate current index
            if (currentIndex < -1 || currentIndex >= fulfilmentEntityIds.size()) {
                logger.error(
                        "Invalid current index: {} for session with {} entities - sessionId: {}",
                        currentIndex, fulfilmentEntityIds.size(), fulfilmentSessionId);
                return Optional.empty();
            }

            // Calculate next index
            int nextIndex = currentIndex + 1;
            if (nextIndex >= fulfilmentEntityIds.size()) {
                logger.info(
                        "Reached end of fulfilment workflow - sessionId: {}, finalIndex: {}, totalEntities: {}",
                        fulfilmentSessionId, currentIndex, fulfilmentEntityIds.size());
                return Optional.empty();
            }

            // Get next entity
            String nextEntityId = fulfilmentEntityIds.get(nextIndex);

            logger.info(
                    "Next fulfilment entity determined - sessionId: {}, currentIndex: {}, nextIndex: {}, nextEntityId: {}",
                    fulfilmentSessionId, currentIndex, nextIndex, nextEntityId);

            return Optional.of(new GetNextFulfilmentEntityResponse(nextEntityId));
        } catch (Exception e) {
            logger.error("Error getting next fulfilment entity - sessionId: {}, currentIndex: {}",
                    fulfilmentSessionId, currentIndex, e);
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
            logger.info(
                    "[FulfilmentService] Getting previous fulfilment entity for session ID: {} at index: {}",
                    fulfilmentSessionId, currentIndex);
            Optional<FulfilmentSession> maybeFulfilmentSession =
                    getFulfilmentSessionById(fulfilmentSessionId);
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

            return Optional.of(new GetPrevFulfilmentEntityResponse(prevEntityId));
        } catch (Exception e) {
            logger.error("Failed to get previous fulfilment entity for session ID: {}",
                    fulfilmentSessionId, e);
            return Optional.empty();
        }
    }

    /**
     * Gets the first fulfilment entity to start the workflow. This is a convenience method that
     * starts from index -1 (before the first entity).
     */
    public static Optional<GetNextFulfilmentEntityResponse> getFirstFulfilmentEntity(
            String fulfilmentSessionId) {
        return getNextFulfilmentEntity(fulfilmentSessionId, -1);
    }

    /**
     * Gets the next fulfilment entity after the specified current entity ID. If currentEntityId is
     * null or empty, returns the first entity.
     */
    public static Optional<GetNextFulfilmentEntityResponse> getNextFulfilmentEntityByCurrentId(
            String fulfilmentSessionId, String currentEntityId) {
        try {
            logger.info(
                    "[FulfilmentService] Getting next fulfilment entity for session: {} with current entity ID: {}",
                    fulfilmentSessionId, currentEntityId);
            // If no current entity ID provided, return the first entity
            if (currentEntityId == null || currentEntityId.isEmpty()) {
                return getFirstFulfilmentEntity(fulfilmentSessionId);
            }

            // Get session and find current entity index
            Optional<FulfilmentSession> maybeFulfilmentSession =
                    getFulfilmentSessionById(fulfilmentSessionId);
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
            if (completedFulfilmentEntity(
                    fulfilmentSession.getFulfilmentEntityMap().get(currentEntityId))) {
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
            Optional<FormResponse> maybeFormResponse =
                    FormsRepository.getFormResponseById(formsEntity.getFormId(),
                            formsEntity.getEventId(), formsEntity.getFormResponseId());
            if (maybeFormResponse.isEmpty()) {
                logger.info(
                        "Form response not found for form ID: {}, event ID: {}, response ID: {}",
                        formsEntity.getFormId(), formsEntity.getEventId(),
                        formsEntity.getFormResponseId());
                return false;
            }

            FormResponse formResponse = maybeFormResponse.get();
            return FormsUtils.isFormResponseComplete(formResponse);
        }
        return true;
    }

    /**
     * Gets the previous fulfilment entity before the specified current entity ID. If
     * currentEntityId is null or empty, returns empty (no previous entity).
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
            Optional<FulfilmentSession> maybeFulfilmentSession =
                    getFulfilmentSessionById(fulfilmentSessionId);
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
    private static Optional<FulfilmentSession> getFulfilmentSessionById(
            String fulfilmentSessionId) {
        try {
            Optional<FulfilmentSession> maybeFulfilmentSession =
                    FulfilmentSessionRepository.getFulfilmentSession(fulfilmentSessionId);
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
            Map<String, FulfilmentEntity> fulfilmentEntityMap =
                    fulfilmentSession.getFulfilmentEntityMap();

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
                logger.error("Fulfilment entity not found for ID: {} in session: {}",
                        fulfilmentEntityId, fulfilmentSessionId);
                return Optional.empty();
            }

            logger.info("Retrieved fulfilment entity info for ID: {} in session: {}; entity: {}",
                    fulfilmentEntityId, fulfilmentSessionId, entity);

            return Optional.of(new GetFulfilmentEntityInfoResponse(entity.getType(),
                    getEntityUrl(entity), maybeFulfilmentSession.get().getEventData().getEventId(),
                    maybeFulfilmentSession.get().getEventData().getFormId(),
                    entity.getType() == FulfilmentEntityType.FORMS
                            ? ((FormsFulfilmentEntity) entity).getFormResponseId()
                            : null));
        } catch (Exception e) {
            logger.error(
                    "Failed to get fulfilment entity info for session ID: {} and entity ID: {}",
                    fulfilmentSessionId, fulfilmentEntityId, e);
            return Optional.empty();
        }
    }

    /**
     * Retrieves fulfilment session information including entity types and current position.
     *
     * @param fulfilmentSessionId The ID of the fulfilment session
     * @param currentFulfilmentEntityId The current fulfilment entity ID (optional)
     * @return Optional containing the response with the list of fulfilment entity types and current
     *         index, or empty if the session is not found
     */
    public static Optional<GetFulfilmentSessionInfoResponse> getFulfilmentSessionInfo(
            String fulfilmentSessionId, String currentFulfilmentEntityId) {
        try {
            Optional<FulfilmentSession> maybeFulfilmentSession =
                    getFulfilmentSessionById(fulfilmentSessionId);
            if (maybeFulfilmentSession.isEmpty()) {
                logger.error("Fulfilment session not found for ID: {}", fulfilmentSessionId);
                return Optional.empty();
            }

            FulfilmentSession fulfilmentSession = maybeFulfilmentSession.get();
            List<String> fulfilmentEntityIds = fulfilmentSession.getFulfilmentEntityIds();
            Map<String, FulfilmentEntity> fulfilmentEntityMap =
                    fulfilmentSession.getFulfilmentEntityMap();

            // Extract the types in the same order as the entity IDs
            List<FulfilmentEntityType> fulfilmentEntityTypes =
                    fulfilmentEntityIds.stream().map(entityId -> {
                        FulfilmentEntity entity = fulfilmentEntityMap.get(entityId);
                        return entity != null ? entity.getType() : null;
                    }).filter(type -> type != null) // Filter out any null types
                            .collect(java.util.stream.Collectors.toList());

            // Calculate current index if current entity ID is provided
            Integer currentEntityIndex = null;
            if (currentFulfilmentEntityId != null && !currentFulfilmentEntityId.isEmpty()) {
                int index = fulfilmentEntityIds.indexOf(currentFulfilmentEntityId);
                if (index != -1) {
                    currentEntityIndex = index;
                    logger.info("Current entity index for session {}: {}", fulfilmentSessionId,
                            currentEntityIndex);
                } else {
                    logger.warn("Current entity ID {} not found in session {}",
                            currentFulfilmentEntityId, fulfilmentSessionId);
                }
            }

            logger.info("Retrieved {} fulfilment entity types for session: {}",
                    fulfilmentEntityTypes.size(), fulfilmentSessionId);

            return Optional.of(new GetFulfilmentSessionInfoResponse(fulfilmentEntityTypes,
                    currentEntityIndex, fulfilmentSession.getFulfilmentSessionStartTime()));
        } catch (Exception e) {
            logger.error("Failed to get fulfilment session info for session ID: {}",
                    fulfilmentSessionId, e);
            return Optional.empty();
        }
    }

    /**
     * @param fulfilmentSessionId
     * @param fulfilmentEntityId
     * @param formResponseId
     * @return `true` if the fulfilment entity was updated successfully, `false` otherwise
     */
    public static boolean updateFulfilmentEntityWithFormResponseId(String fulfilmentSessionId,
            String fulfilmentEntityId, String formResponseId) {
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
     * @param fulfilmentEntityId Should be the fulfilment entity ID of an `END` fulfilment entity;
     *        otherwise, we will fail the completion
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
            Map<String, FulfilmentEntity> fulfilmentEntityMap =
                    fulfilmentSession.getFulfilmentEntityMap();

            FulfilmentEntity entity = fulfilmentEntityMap.get(fulfilmentEntityId);
            if (entity == null || entity.getType() != FulfilmentEntityType.END) {
                logger.error("Invalid fulfilment entity ID: {} for entity: {} in session: {}",
                        fulfilmentEntityId, entity, fulfilmentSessionId);
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
