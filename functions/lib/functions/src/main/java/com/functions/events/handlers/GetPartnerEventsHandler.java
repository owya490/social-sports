package com.functions.events.handlers;

import com.fasterxml.jackson.databind.JsonNode;
import com.functions.events.models.requests.GetPartnerEventsRequest;
import com.functions.events.models.responses.GetPartnerEventsResponse;
import com.functions.events.services.EventsService;
import com.functions.global.models.AuthContext;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.partners.models.PartnerContext;

public class GetPartnerEventsHandler implements Handler<GetPartnerEventsRequest, GetPartnerEventsResponse> {
    @Override
    public GetPartnerEventsRequest parse(UnifiedRequest request) {
        JsonNode data = request.data();
        if (!data.isObject()) {
            throw new IllegalArgumentException("Invalid request data");
        }
        JsonNode partner = data.get("partner");
        if (partner == null) {
            return new GetPartnerEventsRequest(null);
        }
        if (!partner.isTextual() || partner.textValue().isBlank()) {
            throw new IllegalArgumentException("Invalid request data");
        }
        return new GetPartnerEventsRequest(partner.textValue());
    }

    @Override
    public GetPartnerEventsResponse handle(GetPartnerEventsRequest request, AuthContext authContext) {
        PartnerContext partner = authContext.requirePartner();
        if (request == null || (request.partner() != null && !request.partner().equals(partner.integrationId()))) {
            throw new IllegalArgumentException("Invalid request data");
        }
        return EventsService.getPublicPartnerEventsByOrganiser(partner.organiserId());
    }
}
