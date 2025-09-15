package com.functions.global.models;

import com.functions.events.models.NewEventData;
import com.functions.forms.models.requests.SaveTempFormResponseRequest;
import com.functions.forms.models.responses.SaveTempFormResponseResponse;
import lombok.Getter;

/**
 * Enum defining all available endpoint types with their corresponding request and response classes.
 * This enables type-safe routing and deserialization in the GlobalAppController.
 */
@Getter
public enum EndpointType {
    SAVE_TEMP_FORM_RESPONSE(SaveTempFormResponseRequest.class,
            SaveTempFormResponseResponse.class), CREATE_EVENT(NewEventData.class, String.class);

    private final Class<?> requestClass;
    private final Class<?> responseClass;

    EndpointType(Class<?> requestClass, Class<?> responseClass) {
        this.requestClass = requestClass;
        this.responseClass = responseClass;
    }

}
