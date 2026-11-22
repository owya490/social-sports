package com.functions.events.handlers;

import com.fasterxml.jackson.databind.JsonNode;
import com.functions.events.models.requests.GetPartnerEventCollectionRequest;
import com.functions.events.models.responses.GetPartnerEventCollectionResponse;
import com.functions.events.services.EventsService;
import com.functions.global.models.AuthContext;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.partners.models.PartnerContext;

public class GetPartnerEventCollectionHandler implements Handler<GetPartnerEventCollectionRequest, GetPartnerEventCollectionResponse> {
    @Override
    public GetPartnerEventCollectionRequest parse(UnifiedRequest request) {
        JsonNode data = request.data();
        if (!data.isObject() || !data.has("eventCollectionId") || !data.get("eventCollectionId").isTextual()
                || data.get("eventCollectionId").textValue().isBlank()) {
            throw new IllegalArgumentException("Invalid request data");
        }
        return new GetPartnerEventCollectionRequest(partnerAssertion(data), data.get("eventCollectionId").textValue());
    }

    @Override
    public GetPartnerEventCollectionResponse handle(GetPartnerEventCollectionRequest request, AuthContext authContext) {
        PartnerContext partner = authContext.requirePartner();
        if (request == null || request.eventCollectionId() == null || request.eventCollectionId().isBlank()
                || (request.partner() != null && !request.partner().equals(partner.integrationId()))) {
            throw new IllegalArgumentException("Invalid request data");
        }
        return EventsService.getPublicPartnerEventCollection(partner.organiserId(), request.eventCollectionId());
    }

    private static String partnerAssertion(JsonNode data) {
        JsonNode partner = data.get("partner");
        if (partner == null) {
            return null;
        }
        if (!partner.isTextual() || partner.textValue().isBlank()) {
            throw new IllegalArgumentException("Invalid request data");
        }
        return partner.textValue();
    }
}
