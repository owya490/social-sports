package com.functions.global.models;

import com.functions.events.models.NewEventData;
import com.functions.forms.models.requests.SaveTempFormResponseRequest;

/**
 * Enum defining all available endpoint types with their corresponding request and response classes.
 * This enables type-safe routing and deserialization in the GlobalFunctionsEndpoint.
 */
public enum EndpointType {
    SAVE_TEMP_FORM_RESPONSE(SaveTempFormResponseRequest.class,
            String.class), CREATE_EVENT(NewEventData.class, String.class);

    private final Class<?> requestClass;
    private final Class<?> responseClass;

    EndpointType(Class<?> requestClass, Class<?> responseClass) {
        this.requestClass = requestClass;
        this.responseClass = responseClass;
    }

    public Class<?> getRequestClass() {
        return requestClass;
    }

    public Class<?> getResponseClass() {
        return responseClass;
    }
}
