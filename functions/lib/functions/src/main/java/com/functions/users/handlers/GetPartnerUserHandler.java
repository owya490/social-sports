package com.functions.users.handlers;

import com.fasterxml.jackson.databind.JsonNode;
import com.functions.global.models.AuthContext;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.partners.models.PartnerContext;
import com.functions.users.models.requests.GetPartnerUserRequest;
import com.functions.users.models.responses.GetPartnerUserResponse;
import com.functions.users.services.PartnerUserService;

public class GetPartnerUserHandler implements Handler<GetPartnerUserRequest, GetPartnerUserResponse> {
	@Override
	public GetPartnerUserRequest parse(UnifiedRequest request) {
		JsonNode data = request.data();
		if (!data.isObject()) {
			throw new IllegalArgumentException("Invalid request data");
		}
		JsonNode partner = data.get("partner");
		if (partner == null) {
			return new GetPartnerUserRequest(null);
		}
		if (!partner.isTextual() || partner.textValue().isBlank()) {
			throw new IllegalArgumentException("Invalid request data");
		}
		return new GetPartnerUserRequest(partner.textValue());
	}

	@Override
	public GetPartnerUserResponse handle(GetPartnerUserRequest request, AuthContext authContext) {
		PartnerContext partner = authContext.requirePartner();
		if (request == null || (request.partner() != null && !request.partner().equals(partner.integrationId()))) {
			throw new IllegalArgumentException("Invalid request data");
		}
		return PartnerUserService.getPublicPartnerUser(partner.organiserId());
	}
}
