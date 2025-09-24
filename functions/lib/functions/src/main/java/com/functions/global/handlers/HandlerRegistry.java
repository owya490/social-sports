package com.functions.global.handlers;

import com.functions.events.handlers.CreateEventHandler;
import com.functions.fulfilment.handlers.*;
import com.functions.global.models.EndpointType;
import com.functions.global.models.Handler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;

/**
 * Registry for mapping endpoint types to their corresponding handler implementations.
 * This provides centralized handler management and type-safe routing.
 */
public class HandlerRegistry {
    private static final Logger logger = LoggerFactory.getLogger(HandlerRegistry.class);
    private static final Map<EndpointType, Handler<?, ?>> handlers = new HashMap<>();

    static {
        logger.info("Initializing HandlerRegistry with handlers...");

        registerHandler(EndpointType.CREATE_EVENT, new CreateEventHandler());
        registerHandler(EndpointType.INIT_FULFILMENT_SESSION, new InitFulfilmentSessionHandler());
        registerHandler(EndpointType.UPDATE_FULFILMENT_ENTITY_WITH_FORM_RESPONSE_ID, new UpdateFulfilmentEntityWithFormResponseIdHandler());
        registerHandler(EndpointType.GET_PREV_FULFILMENT_ENTITY, new GetPrevFulfilmentEntityHandler());
        registerHandler(EndpointType.GET_NEXT_FULFILMENT_ENTITY, new GetNextFulfilmentEntityHandler());
        registerHandler(EndpointType.GET_FULFILMENT_SESSION_INFO, new GetFulfilmentSessionInfoHandler());
        registerHandler(EndpointType.GET_FULFILMENT_ENTITY_INFO, new GetFulfilmentEntityInfoHandler());

        logger.info("HandlerRegistry initialized with {} handlers", handlers.size());
    }

    private static void registerHandler(EndpointType endpointType, Handler<?, ?> handler) {
        logger.debug("Registering handler for endpointType: {} -> {}", endpointType, handler.getClass().getSimpleName());
        handlers.put(endpointType, handler);
    }

    /**
     * Get the handler implementation for a given endpoint type.
     *
     * @param endpointType the endpoint type
     * @return the handler implementation
     * @throws IllegalArgumentException if no handler is registered for the endpoint type
     */
    @SuppressWarnings("unchecked")
    public static <S, T> Handler<S, T> getHandler(EndpointType endpointType) {
        logger.debug("Looking up handler for endpointType: {}", endpointType);

        Handler<?, ?> handler = handlers.get(endpointType);
        if (handler == null) {
            logger.error("No handler found for endpointType: {}. Available handlers: {}", endpointType, handlers.keySet());
            throw new IllegalArgumentException("No handler registered for endpoint type: " + endpointType);
        }

        logger.debug("Found handler for endpointType: {} -> {}", endpointType, handler.getClass().getSimpleName());
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
        boolean hasHandler = handlers.containsKey(endpointType);
        logger.debug("Handler exists for endpointType {}: {}", endpointType, hasHandler);
        return hasHandler;
    }
}
