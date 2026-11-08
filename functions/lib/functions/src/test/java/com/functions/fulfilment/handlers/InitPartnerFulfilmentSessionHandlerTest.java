package com.functions.fulfilment.handlers;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.fail;
import static org.mockito.Mockito.mockStatic;

import org.junit.Test;
import org.mockito.MockedStatic;

import com.functions.fulfilment.models.FulfilmentInitialisationScope;
import com.functions.fulfilment.models.InitialisedFulfilmentSession;
import com.functions.fulfilment.models.PaymentProvider;
import com.functions.fulfilment.models.requests.InitPartnerFulfilmentSessionRequest;
import com.functions.fulfilment.services.FulfilmentInitialisationService;
import com.functions.global.models.AuthContext;
import com.functions.global.models.EndpointType;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.partners.models.PartnerContext;
import com.functions.utils.JavaUtils;
import com.functions.utils.environment.Environment;
import com.functions.utils.environment.EnvironmentUtils;

public class InitPartnerFulfilmentSessionHandlerTest {
    private final InitPartnerFulfilmentSessionHandler handler = new InitPartnerFulfilmentSessionHandler();

    @Test
    public void acceptsOnlyThreeTypedInputsWithIntegralPositiveQuantity() throws Exception {
        var request = parse("{\"eventId\":\"event-1\",\"eventTicketTypeId\":\"ticket-1\",\"numTickets\":2}");
        assertEquals(new InitPartnerFulfilmentSessionRequest("event-1", "ticket-1", 2), request);
        for (String quantity : new String[] { "null", "0", "-1", "1.5", "1.0", "\"1\"", "true", "2147483648" }) {
            assertInvalid("{\"eventId\":\"event-1\",\"eventTicketTypeId\":\"ticket-1\",\"numTickets\":" + quantity + "}");
        }
        for (String field : new String[] { "paymentProvider", "isPrivate", "organiserId", "redirectUrl", "apiVersion" }) {
            assertInvalid("{\"eventId\":\"event-1\",\"eventTicketTypeId\":\"ticket-1\",\"numTickets\":1,\"" + field + "\":\"x\"}");
        }
        for (String data : new String[] { "{}", "[]", "null",
                "{\"eventId\":null,\"eventTicketTypeId\":\"ticket-1\",\"numTickets\":1}",
                "{\"eventId\":3,\"eventTicketTypeId\":\"ticket-1\",\"numTickets\":1}",
                "{\"eventId\":\" \",\"eventTicketTypeId\":\"ticket-1\",\"numTickets\":1}",
                "{\"eventId\":\"event-1\",\"eventTicketTypeId\":false,\"numTickets\":1}",
                "{\"eventId\":\"event-1\",\"eventTicketTypeId\":\"\",\"numTickets\":1}" }) {
            assertInvalid(data);
        }
    }

    @Test
    public void returnsOnlyTrustedEnvironmentUrlUsingVerifiedOwnerAndConstructedFirstEntity() throws Exception {
        try (MockedStatic<FulfilmentInitialisationService> fulfilment = mockStatic(FulfilmentInitialisationService.class);
                MockedStatic<EnvironmentUtils> environment = mockStatic(EnvironmentUtils.class)) {
            fulfilment.when(() -> FulfilmentInitialisationService.initialise("event-1", 2, "ticket-1", PaymentProvider.STRIPE,
                    new FulfilmentInitialisationScope.PartnerPublic("assigned-organiser")))
                    .thenReturn(new InitialisedFulfilmentSession("session-1", "first-1"));
            for (Environment value : Environment.values()) {
                environment.when(EnvironmentUtils::getEnvironment).thenReturn(value);
                var response = handler.handle(new InitPartnerFulfilmentSessionRequest("event-1", "ticket-1", 2),
                        partner());
                String base = value == Environment.PRODUCTION ? "https://www.sportshub.net.au" : "http://localhost:3000";
                assertEquals(base + "/fulfilment/session-1/first-1?hideSportshubNavbar=true", response.entryUrl());
                assertEquals("{\"entryUrl\":\"" + response.entryUrl() + "\"}",
                        JavaUtils.objectMapper.writeValueAsString(response));
            }
        }
    }

    @Test
    public void missingOrUnknownEnvironmentFailsBeforeInitialization() throws Exception {
        try (MockedStatic<FulfilmentInitialisationService> fulfilment = mockStatic(FulfilmentInitialisationService.class);
                MockedStatic<EnvironmentUtils> environment = mockStatic(EnvironmentUtils.class)) {
            environment.when(EnvironmentUtils::getEnvironment).thenReturn(null);
            try {
                handler.handle(new InitPartnerFulfilmentSessionRequest("event-1", "ticket-1", 1), partner());
                fail("Expected environment rejection");
            } catch (IllegalStateException expected) {
                fulfilment.verifyNoInteractions();
            }
        }
    }

    @Test
    public void publicCallerCannotInitializePartnerBooking() throws Exception {
        try (MockedStatic<FulfilmentInitialisationService> fulfilment = mockStatic(FulfilmentInitialisationService.class)) {
            try {
                handler.handle(new InitPartnerFulfilmentSessionRequest("event-1", "ticket-1", 1), AuthContext.anonymous());
                fail("Expected partner identity requirement");
            } catch (com.functions.global.exceptions.AuthenticationException expected) {
                fulfilment.verifyNoInteractions();
            }
        }
    }

    private InitPartnerFulfilmentSessionRequest parse(String data) throws Exception {
        return handler.parse(new UnifiedRequest(EndpointType.INIT_PARTNER_FULFILMENT_SESSION,
                JavaUtils.objectMapper.readTree(data)));
    }

    private void assertInvalid(String data) throws Exception {
        try {
            parse(data);
            fail("Expected invalid input rejection");
        } catch (IllegalArgumentException expected) {
            assertEquals("Invalid request data", expected.getMessage());
        }
    }

    private AuthContext partner() {
        return AuthContext.partner(new PartnerContext("integration-1", "assigned-organiser", "https://partner.example"));
    }
}
