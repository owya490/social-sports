package com.functions.global.models;

import com.functions.attendee.models.requests.AddAttendeeRequest;
import com.functions.attendee.models.requests.GetEventAttendeeNamesRequest;
import com.functions.attendee.models.requests.SetAttendeeTicketsRequest;
import com.functions.attendee.models.responses.AddAttendeeResponse;
import com.functions.attendee.models.responses.GetEventAttendeeNamesResponse;
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
    SAVE_TEMP_FORM_RESPONSE(SaveTempFormResponseRequest.class, SaveTempFormResponseResponse.class, AuthLevel.PUBLIC),
    CREATE_EVENT(NewEventData.class, String.class, AuthLevel.AUTHENTICATED),
    INIT_FULFILMENT_SESSION(InitCheckoutFulfilmentSessionRequest.class, InitCheckoutFulfilmentSessionResponse.class,
            AuthLevel.PUBLIC),
    UPDATE_FULFILMENT_ENTITY_WITH_FORM_RESPONSE_ID(UpdateFulfilmentEntityWithFormResponseIdRequest.class, String.class,
            AuthLevel.SESSION),
    GET_PREV_FULFILMENT_ENTITY(GetPrevFulfilmentEntityRequest.class, GetPrevFulfilmentEntityResponse.class,
            AuthLevel.SESSION),
    GET_NEXT_FULFILMENT_ENTITY(GetNextFulfilmentEntityRequest.class, GetNextFulfilmentEntityResponse.class,
            AuthLevel.SESSION),
    GET_FULFILMENT_SESSION_INFO(GetFulfilmentSessionInfoRequest.class, GetFulfilmentSessionInfoResponse.class,
            AuthLevel.SESSION),
    GET_FULFILMENT_ENTITY_INFO(GetFulfilmentEntityInfoRequest.class, GetFulfilmentEntityInfoResponse.class,
            AuthLevel.SESSION),
    COMPLETE_FULFILMENT_SESSION(CompleteFulfilmentSessionRequest.class, String.class, AuthLevel.SESSION),
    GET_SPORTSHUB_WRAPPED(GetWrappedRequest.class, GetWrappedResponse.class, AuthLevel.PUBLIC),
    UPDATE_FULFILMENT_ENTITY_WITH_WAITLIST_DATA(UpdateFulfilmentEntityWithWaitlistDataRequest.class,
            UpdateFulfilmentEntityWithWaitlistDataResponse.class, AuthLevel.SESSION),
    GET_SYRIO_EVENTS(GetSyrioEventsRequest.class, GetSyrioEventsResponse.class, AuthLevel.PUBLIC),
    GET_EVENT_BY_ID(GetEventByIdRequest.class, GetEventByIdResponse.class, AuthLevel.PUBLIC),
    GET_ORDER(GetOrderRequest.class, GetOrderResponse.class, AuthLevel.AUTHENTICATED),
    GET_TICKET(GetTicketRequest.class, Ticket.class, AuthLevel.AUTHENTICATED),
    GET_ORDERS_BY_EVENT(GetOrdersByEventRequest.class, GetOrdersByEventResponse.class, AuthLevel.AUTHENTICATED),
    ADD_ATTENDEE(AddAttendeeRequest.class, AddAttendeeResponse.class, AuthLevel.AUTHENTICATED),
    SET_ATTENDEE_TICKETS(SetAttendeeTicketsRequest.class, SetAttendeeTicketsResponse.class, AuthLevel.AUTHENTICATED),
    GET_EVENT_ATTENDEE_NAMES(GetEventAttendeeNamesRequest.class, GetEventAttendeeNamesResponse.class,
            AuthLevel.PUBLIC);

    private final Class<?> requestClass;
    private final Class<?> responseClass;
    private final AuthLevel authLevel;

    EndpointType(Class<?> requestClass, Class<?> responseClass, AuthLevel authLevel) {
        this.requestClass = requestClass;
        this.responseClass = responseClass;
        this.authLevel = authLevel;
    }

}
