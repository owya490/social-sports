package com.functions.global.models.requests;

import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.functions.global.models.EndpointType;

/**
 * Unified request wrapper that contains the endpoint type and request data. This allows the
 * GlobalAppController to route requests to the correct handler while maintaining type safety
 * through Jackson deserialization.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record UnifiedRequest(EndpointType endpointType, JsonNode data) {
    public UnifiedRequest {
        Objects.requireNonNull(endpointType, "endpointType must not be null");
        Objects.requireNonNull(data, "data must not be null");
    }
}
