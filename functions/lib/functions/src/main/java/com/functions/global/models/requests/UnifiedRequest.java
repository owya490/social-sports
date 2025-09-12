package com.functions.global.models.requests;

import com.fasterxml.jackson.databind.JsonNode;
import com.functions.global.models.EndpointType;

/**
 * Unified request wrapper that contains the endpoint type and request data. This allows the
 * GlobalFunctionsEndpoint to route requests to the correct handler while maintaining type safety
 * through Jackson deserialization.
 */
public record UnifiedRequest(EndpointType endpointType, JsonNode data) {
}
