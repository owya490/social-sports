package com.functions.fulfilment.services;

import static com.functions.fulfilment.services.FulfilmentService.getEndFulfilmentEntityId;

import java.util.AbstractMap.SimpleEntry;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.events.models.EventData;
import com.functions.events.repositories.EventsRepository;
import com.functions.fulfilment.models.FulfilmentSessionService;
import com.functions.fulfilment.models.fulfilmentEntities.EndFulfilmentEntity;
import com.functions.fulfilment.models.fulfilmentEntities.FormsFulfilmentEntity;
import com.functions.fulfilment.models.fulfilmentEntities.FulfilmentEntity;
import com.functions.fulfilment.models.fulfilmentEntities.FulfilmentEntityType;
import com.functions.fulfilment.models.fulfilmentEntities.StripeFulfilmentEntity;
import com.functions.fulfilment.models.fulfilmentSession.CheckoutFulfilmentSession;
import com.functions.stripe.exceptions.CheckoutDateTimeException;
import com.functions.stripe.exceptions.CheckoutVacancyException;
import com.functions.stripe.services.StripeService;
import com.functions.utils.UrlUtils;
import com.google.cloud.Timestamp;

public class CheckoutFulfilmentService implements FulfilmentSessionService<CheckoutFulfilmentSession> {

    private static final Logger logger = LoggerFactory.getLogger(CheckoutFulfilmentService.class);

    /**
     * Initializes a checkout fulfilment session for the given event ID.
     */
    public CheckoutFulfilmentSession initFulfilmentSession(String fulfilmentSessionId, String eventId,
            Integer numTickets) throws Exception {
        try {

            Optional<EventData> maybeEventData = EventsRepository.getEventById(eventId);
            if (maybeEventData.isEmpty()) {
                logger.error("Failed to find event data for event ID: {}", eventId);
                throw new Exception("Failed to find event data for event ID: " + eventId);
            }

            EventData eventData = maybeEventData.get();
            List<SimpleEntry<String, FulfilmentEntity>> fulfilmentEntities = constructCheckoutFulfilmentEntities(
                    eventId,
                    eventData, numTickets,
                    fulfilmentSessionId);
            logger.info(
                    "Constructed checkout fulfilment entities for event ID: {}, numTickets: {}, fulfilmentSessionId: {}, entityTypes: {}",
                    eventId, numTickets, fulfilmentSessionId,
                    fulfilmentEntities.stream()
                            .map(e -> e.getValue().getType())
                            .collect(Collectors.toList()));
            logger.debug("Constructed fulfilment entities (full): {}",
                    fulfilmentEntities.stream()
                            .map(SimpleEntry::getValue)
                            .collect(Collectors.toList()));

            SimpleEntry<Map<String, FulfilmentEntity>, List<String>> orderedFulfilmentEntities = FulfilmentSessionService
                    .getOrderedFulfilmentEntities(fulfilmentEntities);
            Map<String, FulfilmentEntity> entityMap = orderedFulfilmentEntities.getKey();
            List<String> entityOrder = orderedFulfilmentEntities.getValue();

            CheckoutFulfilmentSession session = CheckoutFulfilmentSession.builder()
                    .fulfilmentSessionStartTime(Timestamp.now())
                    .eventData(eventData)
                    .fulfilmentEntityMap(entityMap).fulfilmentEntityIds(entityOrder)
                    .numTickets(numTickets)
                    .build();

            return session;
        } catch (CheckoutDateTimeException e) {
            // Don't log error and alert for error that is outside of our direct control
            // because this is a time based error.
            logger.warn("Cannot checkout for event {}: time based error: {}", eventId, e);
            throw e;
        } catch (CheckoutVacancyException e) {
            // Don't log error and alert for error that is outside of our direct control
            // because this is a vacancy error.
            logger.warn("Cannot checkout for event {}: vacancy error: {}", eventId, e);
            throw e;
        } catch (Exception e) {
            logger.error("Failed to init checkout fulfilment session: {}", eventId, e);
            throw e;
        }
    }

    private static List<SimpleEntry<String, FulfilmentEntity>> constructCheckoutFulfilmentEntities(
            String eventId, EventData eventData, Integer numTickets, String fulfilmentSessionId) {
        // Pair of FulfilmentEntityId and FulfilmentEntity
        List<SimpleEntry<String, FulfilmentEntity>> fulfilmentEntities = new ArrayList<>();

        List<FulfilmentEntity> tempEntities = new ArrayList<>();

        // 1. FORMS entities - one for each ticket
        try {
            Optional<String> formId = Optional.ofNullable(eventData.getFormId());
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
                        .orElse(UrlUtils.SPORTSHUB_URL + "/dashboard"))
                .type(FulfilmentEntityType.END).build());

        List<String> entityIds = new ArrayList<>();
        for (int i = 0; i < tempEntities.size(); i++) {
            entityIds.add(UUID.randomUUID().toString());
        }

        String endFulfilmentEntityId = getEndFulfilmentEntityId(eventId, tempEntities, entityIds);

        // TODO: simplify this piece of code once we modularise stripe checkout python
        // logic
        for (int i = 0; i < tempEntities.size(); i++) {
            FulfilmentEntity entity = tempEntities.get(i);
            String entityId = entityIds.get(i);

            if (entity.getType() == FulfilmentEntityType.STRIPE) {
                String prevEntityId = (i - 1 >= 0) ? entityIds.get(i - 1) : null;
                String cancelUrl = prevEntityId != null
                        ? UrlUtils
                                .getUrlWithCurrentEnvironment(String.format("/fulfilment/%s/%s",
                                        fulfilmentSessionId, prevEntityId))
                                .orElse(UrlUtils.getUrlWithCurrentEnvironment("/event/" + eventId)
                                        .orElse(UrlUtils.SPORTSHUB_URL))
                        : UrlUtils.getUrlWithCurrentEnvironment("/event/" + eventId).orElse(UrlUtils.SPORTSHUB_URL);

                String stripeCheckoutLink = StripeService.getStripeCheckoutUrl(eventId,
                        eventData.getIsPrivate(), numTickets, Optional.empty(), Optional.of(cancelUrl),
                        fulfilmentSessionId, endFulfilmentEntityId);

                logger.info("Created Stripe checkout link for event ID {}", eventId);
                logger.debug("Stripe checkout link: {}", stripeCheckoutLink);
                entity = StripeFulfilmentEntity.builder().url(stripeCheckoutLink)
                        .type(FulfilmentEntityType.STRIPE).build();
                fulfilmentEntities.add(new SimpleEntry<>(entityId, entity));
            } else {
                fulfilmentEntities.add(new SimpleEntry<>(entityId, entity));
            }
        }

        return fulfilmentEntities;
    }

}
