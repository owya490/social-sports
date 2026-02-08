package com.functions.events.handlers;

import static com.functions.firebase.services.FirebaseService.CollectionPaths.ACTIVE;
import static com.functions.firebase.services.FirebaseService.CollectionPaths.EVENTS;
import static com.functions.firebase.services.FirebaseService.CollectionPaths.PUBLIC;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.events.models.EventData;
import com.functions.events.models.requests.GetSyrioEventsRequest;
import com.functions.events.models.responses.GetSyrioEventsResponse;
import com.functions.firebase.services.FirebaseService;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.utils.JavaUtils;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;

/**
 * Handler for getting Syrio events.
 */
public class GetSyrioEventsHandler implements Handler<GetSyrioEventsRequest, GetSyrioEventsResponse> {
    private static final Logger logger = LoggerFactory.getLogger(GetSyrioEventsHandler.class);
    private static final String SYRIO_ORGANISER_ID = "tihrtHXNCKVkYpmJIVijKDWkkvq2";

    @Override
    public GetSyrioEventsRequest parse(UnifiedRequest data) {
        try {
            return JavaUtils.objectMapper.treeToValue(data.data(), GetSyrioEventsRequest.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse GetSyrioEventsRequest", e);
        }
    }

    @Override
    public GetSyrioEventsResponse handle(GetSyrioEventsRequest request) {
        logger.info("Handling get Syrio events request");

        try {
            List<EventData> events = getSyrioEvents();
            logger.info("Successfully retrieved {} Syrio events", events.size());
            return new GetSyrioEventsResponse(events);
        } catch (Exception e) {
            logger.error("Failed to get Syrio events", e);
            throw new RuntimeException("Failed to get Syrio events: " + e.getMessage(), e);
        }
    }

    private List<EventData> getSyrioEvents() throws InterruptedException, ExecutionException {
        Firestore db = FirebaseService.getFirestore();
        Timestamp now = Timestamp.now();

        Query query = db.collection(EVENTS)
                .document(ACTIVE)
                .collection(PUBLIC)
                .whereEqualTo("organiserId", SYRIO_ORGANISER_ID);

        QuerySnapshot querySnapshot = query.get().get();
        List<EventData> events = new ArrayList<>();

        for (QueryDocumentSnapshot document : querySnapshot.getDocuments()) {
            EventData eventData = document.toObject(EventData.class);
            eventData.setEventId(document.getId());
            events.add(eventData);
        }

        return events.stream()
                .filter(event -> event.getStartDate() != null && event.getStartDate().compareTo(now) >= 0)
                .sorted(Comparator.comparing(EventData::getStartDate))
                .collect(Collectors.toList());
    }
}
