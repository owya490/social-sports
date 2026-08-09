package com.functions.stripe.services;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.Test;

import com.functions.fulfilment.models.fulfilmentEntities.FormsFulfilmentEntity;
import com.functions.fulfilment.models.fulfilmentEntities.StripeFulfilmentEntity;
import com.functions.fulfilment.models.fulfilmentSession.CheckoutFulfilmentSession;

public class WebhookServiceFormResponseTest {

    @Test
    public void extractFormResponseIdsFromRawMapUsesEntityIdsOrdering() {
        Map<String, Object> fulfilmentEntityMap = new HashMap<>();
        fulfilmentEntityMap.put("entity-1", Map.of("type", "FORMS", "formResponseId", "form-1"));
        fulfilmentEntityMap.put("entity-2", Map.of("type", "FORMS", "formResponseId", "form-2"));
        fulfilmentEntityMap.put("entity-3", Map.of("type", "STRIPE"));

        List<String> formResponseIds = WebhookService.extractFormResponseIds(
                fulfilmentEntityMap,
                List.of("entity-2", "entity-1", "entity-3"));

        assertEquals(List.of("form-2", "form-1"), formResponseIds);
    }

    @Test
    public void extractFormResponseIdsFromRawMapFallsBackToMapValuesWhenIdsMissing() {
        Map<String, Object> fulfilmentEntityMap = new HashMap<>();
        fulfilmentEntityMap.put("entity-1", Map.of("type", "FORMS", "formResponseId", "form-1"));
        fulfilmentEntityMap.put("entity-2", Map.of("type", "STRIPE"));
        fulfilmentEntityMap.put("entity-3", Map.of("type", "FORMS", "formResponseId", "form-2"));

        List<String> formResponseIds = WebhookService.extractFormResponseIds(fulfilmentEntityMap, null);

        assertEquals(2, formResponseIds.size());
        assertTrue(formResponseIds.contains("form-1"));
        assertTrue(formResponseIds.contains("form-2"));
    }

    @Test
    public void extractFormResponseIdsFromRawMapSkipsFormsEntitiesWithoutResponseId() {
        Map<String, Object> fulfilmentEntityMap = Map.of(
                "entity-1", Map.of("type", "FORMS"),
                "entity-2", Map.of("type", "FORMS", "formResponseId", "form-2"));

        List<String> formResponseIds = WebhookService.extractFormResponseIds(
                fulfilmentEntityMap,
                List.of("entity-1", "entity-2"));

        assertEquals(List.of("form-2"), formResponseIds);
    }

    @Test
    public void extractFormResponseIdsFromTypedSessionPreservesOrdering() {
        CheckoutFulfilmentSession fulfilmentSession = CheckoutFulfilmentSession.builder()
                .fulfilmentEntityMap(Map.of(
                        "entity-1", FormsFulfilmentEntity.builder().formResponseId("form-1").build(),
                        "entity-2", FormsFulfilmentEntity.builder().formResponseId("form-2").build(),
                        "entity-3", StripeFulfilmentEntity.builder().build()))
                .fulfilmentEntityIds(List.of("entity-2", "entity-1", "entity-3"))
                .build();

        List<String> formResponseIds = WebhookService.extractFormResponseIds(fulfilmentSession);

        assertEquals(List.of("form-2", "form-1"), formResponseIds);
    }
}
