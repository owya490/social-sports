package com.functions.global.models;

import com.functions.attendee.models.requests.AddAttendeeRequest;
import com.functions.attendee.models.requests.SetAttendeeTicketsRequest;
import com.functions.attendee.models.responses.AddAttendeeResponse;
import com.functions.attendee.models.responses.SetAttendeeTicketsResponse;
import com.functions.events.models.NewEventData;
import com.functions.events.models.requests.GetEventByIdRequest;
import com.functions.events.models.requests.GetSyrioEventsRequest;
import com.functions.events.models.responses.GetEventByIdResponse;
import com.functions.events.models.responses.GetSyrioEventsResponse;
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
import com.functions.tickets.models.Ticket;
import com.functions.tickets.models.requests.get.GetOrderRequest;
import com.functions.tickets.models.requests.get.GetOrdersByEventRequest;
import com.functions.tickets.models.requests.get.GetTicketRequest;
import com.functions.tickets.models.responses.get.GetOrderResponse;
import com.functions.tickets.models.responses.get.GetOrdersByEventResponse;
import com.functions.waitlist.models.requests.UpdateFulfilmentEntityWithWaitlistDataRequest;
import com.functions.waitlist.models.responses.UpdateFulfilmentEntityWithWaitlistDataResponse;
import com.functions.wrapped.models.requests.GetWrappedRequest;
import com.functions.wrapped.models.responses.GetWrappedResponse;

import lombok.Getter;

/**
 * Enum defining all available endpoint types with their corresponding request
 * and response classes.
 * This enables type-safe routing and deserialization in the
 * GlobalAppController.
 */
@Getter
public enum EndpointType {
    SAVE_TEMP_FORM_RESPONSE(SaveTempFormResponseRequest.class, SaveTempFormResponseResponse.class),
    CREATE_EVENT(NewEventData.class, String.class),
    INIT_FULFILMENT_SESSION(InitCheckoutFulfilmentSessionRequest.class, InitCheckoutFulfilmentSessionResponse.class),
    UPDATE_FULFILMENT_ENTITY_WITH_FORM_RESPONSE_ID(UpdateFulfilmentEntityWithFormResponseIdRequest.class, String.class),
    GET_PREV_FULFILMENT_ENTITY(GetPrevFulfilmentEntityRequest.class, GetPrevFulfilmentEntityResponse.class),
    GET_NEXT_FULFILMENT_ENTITY(GetNextFulfilmentEntityRequest.class, GetNextFulfilmentEntityResponse.class),
    GET_FULFILMENT_SESSION_INFO(GetFulfilmentSessionInfoRequest.class, GetFulfilmentSessionInfoResponse.class),
    GET_FULFILMENT_ENTITY_INFO(GetFulfilmentEntityInfoRequest.class, GetFulfilmentEntityInfoResponse.class),
    COMPLETE_FULFILMENT_SESSION(CompleteFulfilmentSessionRequest.class, String.class),
    GET_SPORTSHUB_WRAPPED(GetWrappedRequest.class, GetWrappedResponse.class),
    UPDATE_FULFILMENT_ENTITY_WITH_WAITLIST_DATA(UpdateFulfilmentEntityWithWaitlistDataRequest.class,
            UpdateFulfilmentEntityWithWaitlistDataResponse.class),
    GET_SYRIO_EVENTS(GetSyrioEventsRequest.class, GetSyrioEventsResponse.class),
    GET_EVENT_BY_ID(GetEventByIdRequest.class, GetEventByIdResponse.class),
    GET_ORDER(GetOrderRequest.class, GetOrderResponse.class),
    GET_TICKET(GetTicketRequest.class, Ticket.class),
    GET_ORDERS_BY_EVENT(GetOrdersByEventRequest.class, GetOrdersByEventResponse.class),
    ADD_ATTENDEE(AddAttendeeRequest.class, AddAttendeeResponse.class),
    SET_ATTENDEE_TICKETS(SetAttendeeTicketsRequest.class, SetAttendeeTicketsResponse.class);

    private final Class<?> requestClass;
    private final Class<?> responseClass;

    EndpointType(Class<?> requestClass, Class<?> responseClass) {
        this.requestClass = requestClass;
        this.responseClass = responseClass;
    }

}
