package com.functions.global.models;

import com.functions.events.models.NewEventData;
import com.functions.forms.models.requests.SaveTempFormResponseRequest;
import com.functions.forms.models.responses.SaveTempFormResponseResponse;
import com.functions.fulfilment.models.requests.CompleteFulfilmentSessionRequest;
import com.functions.fulfilment.models.requests.GetFulfilmentEntityInfoRequest;
import com.functions.fulfilment.models.requests.GetFulfilmentSessionInfoRequest;
import com.functions.fulfilment.models.requests.GetNextFulfilmentEntityRequest;
import com.functions.fulfilment.models.requests.GetPrevFulfilmentEntityRequest;
import com.functions.fulfilment.models.requests.InitCheckoutFulfilmentSessionRequest;
import com.functions.fulfilment.models.requests.UpdateFulfilmentEntityWithFormResponseIdRequest;
import com.functions.fulfilment.models.responses.GetFulfilmentEntityInfoResponse;
import com.functions.fulfilment.models.responses.GetFulfilmentSessionInfoResponse;
import com.functions.fulfilment.models.responses.GetNextFulfilmentEntityResponse;
import com.functions.fulfilment.models.responses.GetPrevFulfilmentEntityResponse;
import com.functions.fulfilment.models.responses.InitCheckoutFulfilmentSessionResponse;
import com.functions.wrapped.models.requests.GetWrappedRequest;
import com.functions.wrapped.models.responses.GetWrappedResponse;

import lombok.Getter;

/**
 * Enum defining all available endpoint types with their corresponding request and response classes.
 * This enables type-safe routing and deserialization in the GlobalAppController.
 */
@Getter
public enum EndpointType {
    SAVE_TEMP_FORM_RESPONSE(SaveTempFormResponseRequest.class,SaveTempFormResponseResponse.class), 
    CREATE_EVENT(NewEventData.class, String.class),
    INIT_FULFILMENT_SESSION(InitCheckoutFulfilmentSessionRequest.class, InitCheckoutFulfilmentSessionResponse.class),
    UPDATE_FULFILMENT_ENTITY_WITH_FORM_RESPONSE_ID(UpdateFulfilmentEntityWithFormResponseIdRequest.class, String.class),
    GET_PREV_FULFILMENT_ENTITY(GetPrevFulfilmentEntityRequest.class, GetPrevFulfilmentEntityResponse.class),
    GET_NEXT_FULFILMENT_ENTITY(GetNextFulfilmentEntityRequest.class, GetNextFulfilmentEntityResponse.class),
    GET_FULFILMENT_SESSION_INFO(GetFulfilmentSessionInfoRequest.class, GetFulfilmentSessionInfoResponse.class),
    GET_FULFILMENT_ENTITY_INFO(GetFulfilmentEntityInfoRequest.class, GetFulfilmentEntityInfoResponse.class),
    COMPLETE_FULFILMENT_SESSION(CompleteFulfilmentSessionRequest.class, String.class),
    GET_SPORTSHUB_WRAPPED(GetWrappedRequest.class, GetWrappedResponse.class);

    private final Class<?> requestClass;
    private final Class<?> responseClass;

    EndpointType(Class<?> requestClass, Class<?> responseClass) {
        this.requestClass = requestClass;
        this.responseClass = responseClass;
    }

}
