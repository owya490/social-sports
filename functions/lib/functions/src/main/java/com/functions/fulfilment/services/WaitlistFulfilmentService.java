package com.functions.fulfilment.services;

import java.util.AbstractMap.SimpleEntry;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.events.models.EventData;
import com.functions.events.repositories.EventsRepository;
import com.functions.fulfilment.models.fulfilmentEntities.EndFulfilmentEntity;
import com.functions.fulfilment.models.fulfilmentEntities.FulfilmentEntity;
import com.functions.fulfilment.models.fulfilmentEntities.FulfilmentEntityType;
import com.functions.fulfilment.models.fulfilmentEntities.WaitlistFulfilmentEntity;
import com.functions.fulfilment.models.FulfilmentSessionService;
import com.functions.fulfilment.models.fulfilmentSession.WaitlistFulfilmentSession;
import com.functions.utils.UrlUtils;
import com.google.cloud.Timestamp;

public class WaitlistFulfilmentService implements FulfilmentSessionService<WaitlistFulfilmentSession> {
    
    private static final Logger logger = LoggerFactory.getLogger(WaitlistFulfilmentService.class);

    public WaitlistFulfilmentSession initFulfilmentSession(String fulfilmentSessionId, String eventId, Integer numTickets) throws Exception {
        try {
            Optional<EventData> maybeEventData = EventsRepository.getEventById(eventId);
            if (maybeEventData.isEmpty()) {
                logger.error("Failed to find event data for event ID: {}", eventId);
                throw new Exception("Failed to find event data for event ID: " + eventId);
            }
            EventData eventData = maybeEventData.get();

            if (!Boolean.TRUE.equals(eventData.getWaitlistEnabled())) {
                logger.error("Event is not open for waitlist: {}", eventId);
                throw new Exception("Event is not open for waitlist: " + eventId);
            }
    
            // Pair of FulfilmentEntityId and FulfilmentEntity
            List<SimpleEntry<String, FulfilmentEntity>> fulfilmentEntities = new ArrayList<>();
    
            // 1. Waitlist entity
            String waitlistEntityId = UUID.randomUUID().toString();
            FulfilmentEntity waitlistEntity = WaitlistFulfilmentEntity.builder()
                    .eventId(eventId)
                    .ticketCount(numTickets)
                    .type(FulfilmentEntityType.WAITLIST).build();
            fulfilmentEntities.add(new SimpleEntry<>(waitlistEntityId, waitlistEntity));
            
            // 2. End entity 
            String endEntityId = UUID.randomUUID().toString();
            FulfilmentEntity endEntity = EndFulfilmentEntity.builder()
                    .url(UrlUtils
                    .getUrlWithCurrentEnvironment(String.format("/event/success/%s", eventId))
                    .orElse(UrlUtils.SPORTSHUB_URL + "/dashboard"))
                    .type(FulfilmentEntityType.END).build();
            fulfilmentEntities.add(new SimpleEntry<>(endEntityId, endEntity));
            
            SimpleEntry<Map<String, FulfilmentEntity>, List<String>> orderedFulfilmentEntities = FulfilmentSessionService
                    .getOrderedFulfilmentEntities(fulfilmentEntities);
            Map<String, FulfilmentEntity> entityMap = orderedFulfilmentEntities.getKey();
            List<String> entityOrder = orderedFulfilmentEntities.getValue();
            
            logger.info("initialised fulfilmend session id: {}", fulfilmentSessionId);
            return WaitlistFulfilmentSession.builder()
                    .fulfilmentSessionStartTime(Timestamp.now())
                    .eventData(eventData)
                    .fulfilmentEntityMap(entityMap)
                    .fulfilmentEntityIds(entityOrder)
                    .numTickets(numTickets)
                    .build();
        } catch (Exception e) {
            logger.error("Failed to initialise waitlist fulfilment session: {}", e.getMessage());
            throw e;
        }
    }


}

