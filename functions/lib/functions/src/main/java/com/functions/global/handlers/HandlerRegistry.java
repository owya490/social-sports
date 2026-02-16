package com.functions.global.handlers;

import java.util.HashMap;
import java.util.Map;

import com.functions.events.handlers.CreateEventHandler;
import com.functions.events.handlers.GetSyrioEventsHandler;
import com.functions.forms.handlers.SaveTempFormResponseHandler;
import com.functions.fulfilment.handlers.CompleteFulfilmentSessionHandler;
import com.functions.fulfilment.handlers.GetFulfilmentEntityInfoHandler;
import com.functions.fulfilment.handlers.GetFulfilmentSessionInfoHandler;
import com.functions.fulfilment.handlers.GetNextFulfilmentEntityHandler;
import com.functions.fulfilment.handlers.GetPrevFulfilmentEntityHandler;
import com.functions.fulfilment.handlers.InitFulfilmentSessionHandler;
import com.functions.fulfilment.handlers.UpdateFulfilmentEntityWithFormResponseIdHandler;
import com.functions.global.models.EndpointType;
import com.functions.global.models.Handler;
import com.functions.tickets.handlers.BookingApprovalHandler;
import com.functions.waitlist.handlers.UpdateFulfilmentEntityWithWaitlistDataHandler;
import com.functions.wrapped.handlers.GetWrappedHandler;
import com.functions.wrapped.handlers.GetWrappedHandler;

/**
 * Registry for mapping endpoint types to their corresponding handler
 * implementations.
 * This provides centralized handler management and type-safe routing.
 */
public class HandlerRegistry {
    private static final Map<EndpointType, Handler<?, ?>> handlers = new HashMap<>();

    static {
        handlers.put(EndpointType.SAVE_TEMP_FORM_RESPONSE, new SaveTempFormResponseHandler());
        handlers.put(EndpointType.CREATE_EVENT, new CreateEventHandler());
        handlers.put(EndpointType.INIT_FULFILMENT_SESSION, new InitFulfilmentSessionHandler());
        handlers.put(EndpointType.UPDATE_FULFILMENT_ENTITY_WITH_FORM_RESPONSE_ID,
                new UpdateFulfilmentEntityWithFormResponseIdHandler());
        handlers.put(EndpointType.GET_PREV_FULFILMENT_ENTITY, new GetPrevFulfilmentEntityHandler());
        handlers.put(EndpointType.GET_NEXT_FULFILMENT_ENTITY, new GetNextFulfilmentEntityHandler());
        handlers.put(EndpointType.GET_FULFILMENT_SESSION_INFO, new GetFulfilmentSessionInfoHandler());
        handlers.put(EndpointType.GET_FULFILMENT_ENTITY_INFO, new GetFulfilmentEntityInfoHandler());
        handlers.put(EndpointType.COMPLETE_FULFILMENT_SESSION, new CompleteFulfilmentSessionHandler());
        handlers.put(EndpointType.GET_SPORTSHUB_WRAPPED, new GetWrappedHandler());
        handlers.put(EndpointType.UPDATE_FULFILMENT_ENTITY_WITH_WAITLIST_DATA,
                new UpdateFulfilmentEntityWithWaitlistDataHandler());
        handlers.put(EndpointType.BOOKING_APPROVAL, new BookingApprovalHandler());
        handlers.put(EndpointType.GET_SYRIO_EVENTS, new GetSyrioEventsHandler());
    }

    /**
     * Get the handler implementation for a given endpoint type.
     *
     * @param endpointType the endpoint type
     * @return the handler implementation
     * @throws IllegalArgumentException if no handler is registered for the endpoint
     *                                  type
     */
    @SuppressWarnings("unchecked")
    public static <S, T> Handler<S, T> getHandler(EndpointType endpointType) {
        Handler<?, ?> handler = handlers.get(endpointType);
        if (handler == null) {
            throw new IllegalArgumentException("No handler registered for endpoint type: " + endpointType);
        }
        // This cast is safe because the handlers map is populated in a type-safe manner
        return (Handler<S, T>) handler;
    }

    /**
     * Check if a handler is registered for the given endpoint type.
     *
     * @param endpointType the endpoint type
     * @return true if a handler is registered, false otherwise
     */
    public static boolean hasHandler(EndpointType endpointType) {
        return handlers.containsKey(endpointType);
    }
}
