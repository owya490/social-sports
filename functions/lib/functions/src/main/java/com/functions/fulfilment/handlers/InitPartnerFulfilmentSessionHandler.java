package com.functions.fulfilment.handlers;

import com.fasterxml.jackson.databind.JsonNode;
import com.functions.fulfilment.models.FulfilmentInitialisationScope;
import com.functions.fulfilment.models.InitialisedFulfilmentSession;
import com.functions.fulfilment.models.PaymentProvider;
import com.functions.fulfilment.models.requests.InitPartnerFulfilmentSessionRequest;
import com.functions.fulfilment.models.responses.InitPartnerFulfilmentSessionResponse;
import com.functions.fulfilment.services.FulfilmentInitialisationService;
import com.functions.global.models.AuthContext;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.utils.UrlUtils;
import com.functions.utils.environment.Environment;
import com.functions.utils.environment.EnvironmentUtils;

public class InitPartnerFulfilmentSessionHandler
        implements Handler<InitPartnerFulfilmentSessionRequest, InitPartnerFulfilmentSessionResponse> {
    @Override
    public InitPartnerFulfilmentSessionRequest parse(UnifiedRequest request) {
        JsonNode data = request.data();
        if (!data.isObject() || data.size() != 3 || !data.has("eventId") || !data.has("eventTicketTypeId")
                || !data.has("numTickets") || !data.get("eventId").isTextual()
                || !data.get("eventTicketTypeId").isTextual() || !data.get("numTickets").isIntegralNumber()
                || !data.get("numTickets").canConvertToInt()) {
            throw new IllegalArgumentException("Invalid request data");
        }
        return new InitPartnerFulfilmentSessionRequest(data.get("eventId").textValue(),
                data.get("eventTicketTypeId").textValue(), data.get("numTickets").intValue());
    }

    @Override
    public InitPartnerFulfilmentSessionResponse handle(InitPartnerFulfilmentSessionRequest request,
            AuthContext authContext) throws Exception {
        var partner = authContext.requirePartner();
        Environment environment = EnvironmentUtils.getEnvironment();
        if (environment == null) {
            throw new IllegalStateException("Booking environment is not configured");
        }
        String baseUrl = switch (environment) {
            case PRODUCTION -> UrlUtils.SPORTSHUB_URL;
            case DEVELOPMENT -> "http://localhost:3000";
        };
        InitialisedFulfilmentSession session = FulfilmentInitialisationService.initialise(request.eventId(),
                request.numTickets(), request.eventTicketTypeId(), PaymentProvider.STRIPE,
                new FulfilmentInitialisationScope.PartnerPublic(partner.organiserId()));
        return new InitPartnerFulfilmentSessionResponse(baseUrl + "/fulfilment/" + session.fulfilmentSessionId()
                + "/" + session.firstFulfilmentEntityId() + "?hideSportshubNavbar=true");
    }
}
