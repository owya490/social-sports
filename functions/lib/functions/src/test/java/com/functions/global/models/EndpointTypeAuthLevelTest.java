package com.functions.global.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

import org.junit.Test;

import com.functions.global.handlers.HandlerRegistry;

/**
 * Pins the auth level of every endpoint.
 * <p>
 * Auth levels are the entire access-control model for the GlobalAppController, and
 * getting one wrong is silent - the endpoint keeps working, just for the wrong
 * people. Changing a level here must be a deliberate edit to this table, and a new
 * endpoint cannot be added without declaring what it expects.
 */
public class EndpointTypeAuthLevelTest {

    private static final Map<EndpointType, AuthLevel> EXPECTED_AUTH_LEVELS = new EnumMap<>(EndpointType.class);

    static {
        // Unauthenticated: safe for anyone on the internet to call.
        EXPECTED_AUTH_LEVELS.put(EndpointType.SAVE_TEMP_FORM_RESPONSE, AuthLevel.PUBLIC);
        EXPECTED_AUTH_LEVELS.put(EndpointType.INIT_FULFILMENT_SESSION, AuthLevel.PUBLIC);
        EXPECTED_AUTH_LEVELS.put(EndpointType.UPDATE_FULFILMENT_ENTITY_WITH_FORM_RESPONSE_ID, AuthLevel.PUBLIC);
        EXPECTED_AUTH_LEVELS.put(EndpointType.GET_PREV_FULFILMENT_ENTITY, AuthLevel.PUBLIC);
        EXPECTED_AUTH_LEVELS.put(EndpointType.GET_NEXT_FULFILMENT_ENTITY, AuthLevel.PUBLIC);
        EXPECTED_AUTH_LEVELS.put(EndpointType.GET_FULFILMENT_SESSION_INFO, AuthLevel.PUBLIC);
        EXPECTED_AUTH_LEVELS.put(EndpointType.GET_FULFILMENT_ENTITY_INFO, AuthLevel.PUBLIC);
        EXPECTED_AUTH_LEVELS.put(EndpointType.COMPLETE_FULFILMENT_SESSION, AuthLevel.PUBLIC);
        EXPECTED_AUTH_LEVELS.put(EndpointType.UPDATE_FULFILMENT_ENTITY_WITH_WAITLIST_DATA, AuthLevel.PUBLIC);
        EXPECTED_AUTH_LEVELS.put(EndpointType.GET_SYRIO_EVENTS, AuthLevel.PUBLIC);
        EXPECTED_AUTH_LEVELS.put(EndpointType.GET_EVENT_BY_ID, AuthLevel.PUBLIC);
        EXPECTED_AUTH_LEVELS.put(EndpointType.GET_EVENT_ATTENDEE_NAMES, AuthLevel.PUBLIC);
        EXPECTED_AUTH_LEVELS.put(EndpointType.GET_SPORTSHUB_WRAPPED_BY_SHARE_ID, AuthLevel.PUBLIC);

        // Require a verified Firebase ID token. Handlers additionally check ownership.
        EXPECTED_AUTH_LEVELS.put(EndpointType.CREATE_EVENT, AuthLevel.AUTHENTICATED);
        EXPECTED_AUTH_LEVELS.put(EndpointType.CREATE_RECURRENCE_TEMPLATE_V2, AuthLevel.AUTHENTICATED);
        EXPECTED_AUTH_LEVELS.put(EndpointType.UPDATE_RECURRENCE_TEMPLATE_V2, AuthLevel.AUTHENTICATED);
        EXPECTED_AUTH_LEVELS.put(EndpointType.GET_SPORTSHUB_WRAPPED, AuthLevel.AUTHENTICATED);
        EXPECTED_AUTH_LEVELS.put(EndpointType.GET_ORDER, AuthLevel.AUTHENTICATED);
        EXPECTED_AUTH_LEVELS.put(EndpointType.GET_TICKET, AuthLevel.AUTHENTICATED);
        EXPECTED_AUTH_LEVELS.put(EndpointType.GET_ORDERS_BY_EVENT, AuthLevel.AUTHENTICATED);
        EXPECTED_AUTH_LEVELS.put(EndpointType.ADD_ATTENDEE, AuthLevel.AUTHENTICATED);
        EXPECTED_AUTH_LEVELS.put(EndpointType.SET_ATTENDEE_TICKETS, AuthLevel.AUTHENTICATED);
        EXPECTED_AUTH_LEVELS.put(EndpointType.BOOKING_APPROVAL, AuthLevel.AUTHENTICATED);
    }

    @Test
    public void everyEndpointDeclaresAnAuthLevel() {
        for (EndpointType endpointType : EndpointType.values()) {
            assertNotNull("Endpoint " + endpointType + " has no auth level", endpointType.getAuthLevel());
        }
    }

    @Test
    public void everyEndpointIsCoveredByThisTest() {
        Set<EndpointType> undeclared = EnumSet.allOf(EndpointType.class);
        undeclared.removeAll(EXPECTED_AUTH_LEVELS.keySet());

        assertTrue("New endpoints must declare their expected auth level in this test: " + undeclared,
                undeclared.isEmpty());
    }

    @Test
    public void authLevelsMatchTheExpectedTable() {
        for (Map.Entry<EndpointType, AuthLevel> expected : EXPECTED_AUTH_LEVELS.entrySet()) {
            assertEquals("Unexpected auth level for " + expected.getKey(),
                    expected.getValue(), expected.getKey().getAuthLevel());
        }
    }

    /**
     * An endpoint with no handler is a 400 rather than a security hole, but the
     * reverse of this pairing is what matters: routing consults EndpointType for the
     * auth level and HandlerRegistry for the handler, so the two must stay in step.
     */
    @Test
    public void everyEndpointHasARegisteredHandler() {
        for (EndpointType endpointType : EndpointType.values()) {
            assertTrue("No handler registered for " + endpointType, HandlerRegistry.hasHandler(endpointType));
        }
    }
}
