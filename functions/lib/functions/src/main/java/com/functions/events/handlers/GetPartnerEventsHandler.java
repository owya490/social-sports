package com.functions.events.handlers;

import java.util.Map;

import com.fasterxml.jackson.databind.JsonNode;
import com.functions.events.models.requests.GetPartnerEventsRequest;
import com.functions.events.models.responses.GetPartnerEventsResponse;
import com.functions.events.services.EventsService;
import com.functions.global.exceptions.NotFoundException;
import com.functions.global.models.AuthContext;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.utils.environment.Environment;
import com.functions.utils.environment.EnvironmentUtils;

public class GetPartnerEventsHandler implements Handler<GetPartnerEventsRequest, GetPartnerEventsResponse> {
    private static final Map<String, String> PRODUCTION_PARTNERS = Map.of(
            "syd-grass", "98PJNSoCmNU5zslxa1wIdZ3mPdf2");

    @Override
    public GetPartnerEventsRequest parse(UnifiedRequest request) {
        JsonNode data = request.data();
        JsonNode partner = data.isObject() ? data.get("partner") : null;
        if (partner == null || !partner.isTextual() || partner.textValue().isBlank()) {
            throw new IllegalArgumentException("partner is required and must be a nonempty string");
        }
        return new GetPartnerEventsRequest(partner.textValue());
    }

    @Override
    public GetPartnerEventsResponse handle(GetPartnerEventsRequest request, AuthContext authContext) {
        if (request == null || request.partner() == null || request.partner().isBlank()) {
            throw new IllegalArgumentException("partner is required and must be a nonempty string");
        }
        String organiserId = PRODUCTION_PARTNERS.get(request.partner());
        if (organiserId == null) {
            throw new NotFoundException("Partner not found");
        }
        if (EnvironmentUtils.getEnvironment() != Environment.PRODUCTION) {
            throw new IllegalStateException("Partner is not configured in this environment");
        }
        return EventsService.getPublicPartnerEventsByOrganiser(organiserId);
    }
}
