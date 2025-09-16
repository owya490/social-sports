package com.functions.global.services;

import com.functions.events.services.CreateEventService;
import com.functions.forms.services.SaveTempFormResponseService;
import com.functions.global.models.EndpointType;
import com.functions.global.models.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * Registry for mapping endpoint types to their corresponding service implementations.
 * This provides centralized service management and type-safe routing.
 */
public class ServiceRegistry {
    private static final Map<EndpointType, Service<?, ?>> services = new HashMap<>();

    static {
        services.put(EndpointType.SAVE_TEMP_FORM_RESPONSE, new SaveTempFormResponseService());
        services.put(EndpointType.CREATE_EVENT, new CreateEventService());
    }

    /**
     * Get the service implementation for a given endpoint type.
     *
     * @param endpointType the endpoint type
     * @return the service implementation
     * @throws IllegalArgumentException if no service is registered for the endpoint type
     */
    @SuppressWarnings("unchecked")
    public static <S, T> Service<S, T> getService(EndpointType endpointType) {
        Service<?, ?> service = services.get(endpointType);
        if (service == null) {
            throw new IllegalArgumentException("No service registered for endpoint type: " + endpointType);
        }
        // This cast is safe because the services map is populated in a type-safe manner
        return (Service<S, T>) service;
    }

    /**
     * Check if a service is registered for the given endpoint type.
     *
     * @param endpointType the endpoint type
     * @return true if a service is registered, false otherwise
     */
    public static boolean hasService(EndpointType endpointType) {
        return services.containsKey(endpointType);
    }
}
