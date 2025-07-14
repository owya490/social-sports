package com.functions.fulfilment.services;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.events.models.EventData;
import com.functions.events.repositories.EventsRepository;
import com.functions.forms.services.FormsService;
import com.functions.fulfilment.models.FormsFulfilmentEntity;
import com.functions.fulfilment.models.FulfilmentEntity;
import com.functions.fulfilment.models.FulfilmentEntityType;
import com.functions.fulfilment.models.FulfilmentSession;
import com.functions.fulfilment.models.StartFulfilmentEntity;
import com.functions.fulfilment.models.StripeFulfilmentEntity;
import com.functions.fulfilment.models.responses.ExecNextFulfilmentEntityResponse;
import com.functions.fulfilment.repositories.FulfilmentSessionRepository;
import com.functions.stripe.services.StripeService;
import com.functions.utils.UrlUtils;
import com.google.cloud.Timestamp;

public class FulfilmentService {
    private static final Logger logger = LoggerFactory.getLogger((FulfilmentService.class));


    /**
     * Initializes a checkout fulfilment session for a given event and sequence of fulfilment entity types.
     *
     * Generates a unique fulfilment session ID, retrieves event data, and constructs a list of fulfilment entities in the specified order (e.g., START, STRIPE, FORMS). If any required resource (such as a Stripe checkout link or form ID) is missing, the method logs an error and returns an empty Optional. On success, the session is persisted and the session ID is returned.
     *
     * @param eventId the ID of the event for which to initialize the fulfilment session
     * @param numTickets the number of tickets for the event
     * @param fulfilmentEntityTypes the ordered list of fulfilment entity types to include in the session
     * @return an Optional containing the fulfilment session ID if initialization succeeds; otherwise, an empty Optional
     */
    public static Optional<String> initCheckoutFulfilmentSession(String eventId,
                                                                 Integer numTickets,
                                                                 List<FulfilmentEntityType> fulfilmentEntityTypes) {
        try {
            String fulfilmentSessionId = UUID.randomUUID().toString();
            Optional<EventData> maybeEventData = EventsRepository.getEventById(eventId);
            if (maybeEventData.isEmpty()) {
                logger.error("Failed to find event data for event ID: {}", eventId);
                throw new Exception("Failed to find event data for event ID: " + eventId);
            }

            EventData eventData = maybeEventData.get();

            List<FulfilmentEntity> fulfilmentEntities = new ArrayList<>();

            fulfilmentEntities.add(
                    StartFulfilmentEntity.builder()
                            .url(UrlUtils.getUrlWithCurrentEnvironment(String.format("/event/%s", eventId)).orElse("https://sportshub.net.au/dashboard"))
                            .type(FulfilmentEntityType.START)
                            .build()
            );

            for (FulfilmentEntityType type : fulfilmentEntityTypes) {
                switch (type) {
                    case STRIPE: {
                        Optional<String> stripeCheckoutLink = StripeService.getStripeCheckoutFromEventId(
                                eventId,
                                eventData.getIsPrivate(),
                                numTickets,
                                Optional.empty(),
                                fulfilmentSessionId
                        );
                        if (stripeCheckoutLink.isEmpty()) {
                            logger.error("initFulfilmentSession: Creation of fulfilment session failed as no Stripe checkout link found for event ID: {}", eventId);
                            throw new Exception("Creation of fulfilment session failed as no Stripe checkout link found for event ID: " + eventId);
                        }
                        fulfilmentEntities.add(StripeFulfilmentEntity.builder().url(stripeCheckoutLink.get()).type(FulfilmentEntityType.STRIPE).build());
                        break;
                    }
                    case FORMS: {
                        Optional<String> formId = FormsService.getFormIdByEventId(eventId);
                        if (formId.isEmpty()) {
                            logger.error("initFulfilmentSession: Creation of fulfilment session failed as no form found for event ID: {}", eventId);
                            throw new Exception("initFulfilmentSession: Creation of fulfilment session failed as no form found for event ID: " + eventId);
                        }
                        fulfilmentEntities.add(
                                FormsFulfilmentEntity.builder()
                                        .formId(formId.get())
                                        .url("") // TODO: need to update url to the form URL: https://owenyang.atlassian.net/browse/SPORTSHUB-367
                                        .build()
                        );
                        break;
                    }
                }
            }

            return FulfilmentService.createFulfilmentSession(fulfilmentSessionId, eventId, fulfilmentEntities)
                    .map(sessionId -> {
                        if (sessionId.isEmpty()) {
                            throw new RuntimeException("Failed to create fulfilment session for event ID: " + eventId);
                        }
                        return sessionId;
                    });
        } catch (Exception e) {
            logger.error("Failed to init checkout fulfilment session: {}", eventId, e);
        }
        return Optional.empty();
    }

    /**
     * Creates and persists a fulfilment session with the specified session ID, event ID, and list of fulfilment entities.
     *
     * Initializes the session with the current timestamp, associates it with the event data, and sets the current fulfilment index to zero.
     *
     * @param sessionId Unique identifier for the fulfilment session.
     * @param eventId Identifier of the event associated with the session.
     * @param fulfilmentEntities Ordered list of fulfilment entities to be processed in the session.
     * @return An Optional containing the created fulfilment session ID if successful; otherwise, an empty Optional if creation fails.
     */
    private static Optional<String> createFulfilmentSession(String sessionId, String eventId, List<FulfilmentEntity> fulfilmentEntities) {
        try {
            String fulfilmentSessionId = FulfilmentSessionRepository.createFulfilmentSession(sessionId, FulfilmentSession.builder()
                    .fulfilmentSessionStartTime(Timestamp.now())
                    .eventData(EventsRepository.getEventById(eventId).orElseThrow(() -> new Exception("Event not found for ID: " + eventId)))
                    .fulfilmentEntities(fulfilmentEntities)
                    .currentFulfilmentIndex(0) // Start with the first entity // TODO: need to review whether this is actually the best way
                    .build());

            logger.info("Fulfilment session created with ID: {} for event ID: {}", fulfilmentSessionId, eventId);
            return Optional.of(fulfilmentSessionId);
        } catch (Exception e) {
            logger.error("Failed to create fulfilment session for event ID: {}", eventId, e);
            return Optional.empty();
        }
    }

    /**
     * Advances the fulfilment session to the next fulfilment entity and returns its execution details.
     *
     * Retrieves the fulfilment session by ID, increments the current fulfilment index, updates the session,
     * and returns a response containing the URL of the next fulfilment entity, the updated index, and the total number of entities.
     * If all entities have been executed, returns a response with a null URL to indicate completion.
     *
     * @param fulfilmentSessionId the ID of the fulfilment session to advance
     * @return an Optional containing the execution response for the next fulfilment entity, or Optional.empty() if the session is not found or an error occurs
     */
    public static Optional<ExecNextFulfilmentEntityResponse> execNextFulfilmentEntity(String fulfilmentSessionId) {
        try {
            Optional<FulfilmentSession> maybeFulfilmentSession = FulfilmentSessionRepository.getFulfilmentSession(fulfilmentSessionId);
            if (maybeFulfilmentSession.isEmpty()) {
                logger.error("Fulfilment session not found for ID: {}", fulfilmentSessionId);
                return Optional.empty();
            }

            FulfilmentSession fulfilmentSession = maybeFulfilmentSession.get();
            int currentIndex = fulfilmentSession.getCurrentFulfilmentIndex();
            List<FulfilmentEntity> fulfilmentEntities = fulfilmentSession.getFulfilmentEntities();

            if (currentIndex < 0 || currentIndex > fulfilmentEntities.size()) {
                logger.error("Invalid current index: {} for fulfilment session ID: {}", currentIndex, fulfilmentSessionId);
                return Optional.empty();
            }

            int nextIndex = currentIndex + 1;
            if (nextIndex >= fulfilmentEntities.size()) {
                logger.info("All fulfilment entities already executed for session ID: {}", fulfilmentSessionId);
                return Optional.of(new ExecNextFulfilmentEntityResponse(null, currentIndex, fulfilmentEntities.size()));
            }

            FulfilmentEntity nextEntity = fulfilmentEntities.get(nextIndex);

            fulfilmentSession.setCurrentFulfilmentIndex(nextIndex);
            FulfilmentSessionRepository.updateFulfilmentSession(fulfilmentSessionId, fulfilmentSession);

            return Optional.of(
                    new ExecNextFulfilmentEntityResponse(
                            nextEntity.getUrl(),
                            nextIndex,
                            fulfilmentEntities.size()
                    )
            );
        } catch (Exception e) {
            logger.error("Failed to execute next fulfilment entity for session ID: {}", fulfilmentSessionId, e);
            return Optional.empty();
        }
    }

    /**
     * Deletes the fulfilment session associated with the specified session ID.
     *
     * If the session does not exist or deletion fails, the error is logged and no exception is thrown.
     *
     * @param fulfilmentSessionId the unique identifier of the fulfilment session to delete
     */
    public static void deleteFulfilmentSession(String fulfilmentSessionId) {
        try {
            FulfilmentSessionRepository.deleteFulfilmentSession(fulfilmentSessionId);
            logger.info("Fulfilment session deleted successfully for ID: {}", fulfilmentSessionId);
        } catch (Exception e) {
            logger.error("Failed to delete fulfilment session for ID: {}", fulfilmentSessionId, e);
        }
    }
}
