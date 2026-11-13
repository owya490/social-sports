package com.functions.users.handlers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.functions.global.models.AuthContext;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.users.models.requests.ProvisionUserRequest;
import com.functions.users.models.responses.ProvisionUserResponse;
import com.functions.users.provisioning.UserProvisioningService;
import com.functions.utils.JavaUtils;

public class ProvisionUserHandler implements Handler<ProvisionUserRequest, ProvisionUserResponse> {
	private static final Logger logger = LoggerFactory.getLogger(ProvisionUserHandler.class);

	@Override
	public ProvisionUserRequest parse(UnifiedRequest data) {
		try {
			return JavaUtils.objectMapper.treeToValue(data.data(), ProvisionUserRequest.class);
		} catch (JsonProcessingException e) {
			throw new IllegalArgumentException("Failed to parse ProvisionUserRequest", e);
		}
	}

	@Override
	public ProvisionUserResponse handle(ProvisionUserRequest request, AuthContext authContext) throws Exception {
		String userId = authContext.requireUid();
		logger.info("Provisioning user {}", userId);
		return new ProvisionUserResponse(UserProvisioningService.provision(userId));
	}
}
