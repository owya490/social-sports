package com.functions.fulfilment.services;

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
import com.functions.events.models.ResolvedEventTicketType;
import com.functions.events.repositories.EventsRepository;
import com.functions.events.services.EventTicketTypeService;
import com.functions.fulfilment.models.FulfilmentSessionService;
import com.functions.fulfilment.models.fulfilmentEntities.EndFulfilmentEntity;
import com.functions.fulfilment.models.fulfilmentEntities.FormsFulfilmentEntity;
import com.functions.fulfilment.models.fulfilmentEntities.FulfilmentEntity;
import com.functions.fulfilment.models.fulfilmentEntities.FulfilmentEntityType;
import com.functions.fulfilment.models.fulfilmentEntities.PyngFulfilmentEntity;
import com.functions.fulfilment.models.fulfilmentSession.PyngCheckoutFulfilmentSession;
import com.functions.utils.UrlUtils;
import com.google.cloud.Timestamp;

public class PyngCheckoutFulfilmentService implements FulfilmentSessionService<PyngCheckoutFulfilmentSession> {
    private static final Logger logger = LoggerFactory.getLogger(PyngCheckoutFulfilmentService.class);

    @Override
    public PyngCheckoutFulfilmentSession initFulfilmentSession(String fulfilmentSessionId, String eventId,
            Integer numTickets, String eventTicketTypeId) throws Exception {
        Optional<EventData> maybeEventData = EventsRepository.getEventById(eventId);
        if (maybeEventData.isEmpty()) {
            logger.error("Failed to find event data for event ID: {}", eventId);
            throw new Exception("Failed to find event data for event ID: " + eventId);
        }

        EventData eventData = maybeEventData.get();
        ResolvedEventTicketType ticketType = EventTicketTypeService.resolveById(eventData, eventTicketTypeId);
        List<SimpleEntry<String, FulfilmentEntity>> fulfilmentEntities = constructPyngCheckoutFulfilmentEntities(
                eventId, eventData, numTickets, eventTicketTypeId);
        logger.info(
                "Constructed Pyng checkout fulfilment entities for event ID: {}, numTickets: {}, fulfilmentSessionId: {}, entityTypes: {}",
                eventId, numTickets, fulfilmentSessionId,
                fulfilmentEntities.stream().map(entry -> entry.getValue().getType()).collect(Collectors.toList()));

        SimpleEntry<Map<String, FulfilmentEntity>, List<String>> orderedFulfilmentEntities = FulfilmentSessionService
                .getOrderedFulfilmentEntities(fulfilmentEntities);

        return PyngCheckoutFulfilmentSession.builder()
                .id(fulfilmentSessionId)
                .fulfilmentSessionStartTime(Timestamp.now())
                .eventData(eventData)
                .fulfilmentEntityMap(orderedFulfilmentEntities.getKey())
                .fulfilmentEntityIds(orderedFulfilmentEntities.getValue())
                .numTickets(numTickets)
                .eventTicketTypeId(ticketType.getId())
                .eventTicketTypeName(ticketType.getName())
                .pyngMetadata(null)
                .crystallized(false)
                .build();
    }

    private static List<SimpleEntry<String, FulfilmentEntity>> constructPyngCheckoutFulfilmentEntities(
            String eventId, EventData eventData, Integer numTickets, String eventTicketTypeId) {
        List<FulfilmentEntity> tempEntities = new ArrayList<>();

        try {
            Optional<String> formId = EventTicketTypeService.resolveFormId(eventData, eventTicketTypeId);
            if (formId.isPresent()) {
                for (int i = 0; i < numTickets; i++) {
                    tempEntities.add(FormsFulfilmentEntity.builder()
                            .formId(formId.get())
                            .eventId(eventId)
                            .formResponseId(null)
                            .type(FulfilmentEntityType.FORMS)
                            .build());
                }
            }
        } catch (Exception e) {
            logger.error("Error constructing FORMS entities for Pyng checkout event ID: {}", eventId, e);
            throw new RuntimeException(
                    "Failed to construct FORMS entities for Pyng checkout event ID: " + eventId, e);
        }

        tempEntities.add(PyngFulfilmentEntity.builder().type(FulfilmentEntityType.PYNG).build());
        tempEntities.add(EndFulfilmentEntity.builder()
                .url(UrlUtils.getUrlWithCurrentEnvironment(String.format("/event/success/%s", eventId))
                        .orElse(UrlUtils.SPORTSHUB_URL + "/dashboard"))
                .type(FulfilmentEntityType.END)
                .build());

        List<SimpleEntry<String, FulfilmentEntity>> fulfilmentEntities = new ArrayList<>();
        for (FulfilmentEntity entity : tempEntities) {
            fulfilmentEntities.add(new SimpleEntry<>(UUID.randomUUID().toString(), entity));
        }
        return fulfilmentEntities;
    }
}
