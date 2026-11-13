package com.functions.users.handlers;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.fail;
import static org.mockito.Mockito.mockStatic;

import org.junit.Test;
import org.mockito.MockedStatic;

import com.functions.global.exceptions.AuthenticationException;
import com.functions.global.models.AuthContext;
import com.functions.global.models.EndpointType;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.users.models.requests.ProvisionUserRequest;
import com.functions.users.models.responses.ProvisionUserResponse;
import com.functions.users.provisioning.UserProvisioningService;
import com.functions.utils.JavaUtils;

public class ProvisionUserHandlerTest {
    @Test
    public void handle_provisionsTheAuthenticatedUser() throws Exception {
        ProvisionUserHandler handler = new ProvisionUserHandler();
        ProvisionUserRequest request = handler.parse(new UnifiedRequest(EndpointType.PROVISION_USER,
                JavaUtils.objectMapper.readTree("{\"userId\":\"someone-else\"}")));

        try (MockedStatic<UserProvisioningService> provisioning = mockStatic(UserProvisioningService.class)) {
            provisioning.when(() -> UserProvisioningService.provision("uid-1")).thenReturn("uid-1");

            ProvisionUserResponse response = handler.handle(request, AuthContext.authenticated("uid-1"));

            assertNotNull(request);
            assertEquals("uid-1", response.userId());
            provisioning.verify(() -> UserProvisioningService.provision("uid-1"));
        }
    }

    @Test
    public void handle_rejectsAnAnonymousCaller() throws Exception {
        try (MockedStatic<UserProvisioningService> provisioning = mockStatic(UserProvisioningService.class)) {
            try {
                new ProvisionUserHandler().handle(new ProvisionUserRequest(), AuthContext.anonymous());
                fail("expected an anonymous caller to be rejected");
            } catch (AuthenticationException exception) {
                assertNotNull(exception);
            }
            provisioning.verifyNoInteractions();
        }
    }
}
