package com.functions.events.handlers;

import com.fasterxml.jackson.databind.JsonNode;
import com.functions.events.models.requests.GetPartnerEventRequest;
import com.functions.events.models.responses.GetPartnerEventResponse;
import com.functions.events.services.EventsService;
import com.functions.global.models.AuthContext;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.partners.models.PartnerContext;

public class GetPartnerEventHandler implements Handler<GetPartnerEventRequest, GetPartnerEventResponse> {
    @Override
    public GetPartnerEventRequest parse(UnifiedRequest request) {
        JsonNode data = request.data();
        if (!data.isObject() || !data.has("eventId") || !data.get("eventId").isTextual()
                || data.get("eventId").textValue().isBlank()) {
            throw new IllegalArgumentException("Invalid request data");
        }
        return new GetPartnerEventRequest(partnerAssertion(data), data.get("eventId").textValue());
    }

    @Override
    public GetPartnerEventResponse handle(GetPartnerEventRequest request, AuthContext authContext) {
        PartnerContext partner = authContext.requirePartner();
        if (request == null || request.eventId() == null || request.eventId().isBlank()
                || (request.partner() != null && !request.partner().equals(partner.integrationId()))) {
            throw new IllegalArgumentException("Invalid request data");
        }
        return EventsService.getPublicPartnerEvent(partner.organiserId(), request.eventId());
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
