package com.functions.global.services;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.mockito.Mockito.mockStatic;

import org.junit.Test;
import org.mockito.MockedStatic;

import com.functions.global.exceptions.AuthenticationException;
import com.functions.global.models.AuthContext;
import com.functions.global.models.AuthLevel;
import com.functions.global.testutils.FakeHttpRequest;
import com.functions.partners.models.PartnerContext;
import com.functions.partners.services.PartnerIntegrationService;

/**
 * Covers header parsing only. The happy path - a valid Firebase ID token
 * successfully decoded by {@code FirebaseAuth.getInstance().verifyIdToken(...)} -
 * is deliberately not tested here: it requires a live, initialised FirebaseApp
 * backed by real credentials, which this test environment does not have.
 */
public class AuthServiceTest {

    @Test
    public void publicEndpoint_doesNotRequireAnyCredential() {
        AuthContext context = AuthService.verify(FakeHttpRequest.withHeaders(), AuthLevel.PUBLIC);

        assertEquals(AuthLevel.PUBLIC, context.level());
        assertNull(context.uid());
    }

    /**
     * Pins the deliberate design decision that PUBLIC never decodes a token, even
     * when the caller happens to send one. PUBLIC must stay independent of
     * Firebase/the Authorization header so it can never fail due to an invalid or
     * expired token on an endpoint that does not require auth.
     */
    @Test
    public void publicEndpoint_ignoresAuthorizationHeaderEvenWhenPresent() {
        AuthContext context = AuthService.verify(
                FakeHttpRequest.withHeaders("Authorization", "Bearer not-a-real-token",
                        PartnerIntegrationService.KEY_HEADER, "bad-key"), AuthLevel.PUBLIC);

        assertEquals(AuthLevel.PUBLIC, context.level());
        assertNull(context.uid());
    }

    @Test
    public void partnerEndpointUsesOnlyPartnerAdmission() {
        FakeHttpRequest request = FakeHttpRequest.withHeaders("Authorization", "Bearer ignored");
        PartnerContext partner = new PartnerContext("partner-one", "owner-one", "https://partner.example");
        try (MockedStatic<PartnerIntegrationService> admission = mockStatic(PartnerIntegrationService.class)) {
            admission.when(() -> PartnerIntegrationService.verify(request)).thenReturn(partner);

            assertEquals(partner, AuthService.verify(request, AuthLevel.PARTNER).requirePartner());
            admission.verify(() -> PartnerIntegrationService.verify(request));
        }
    }

    @Test(expected = AuthenticationException.class)
    public void partnerKeyDoesNotReplaceFirebaseAuthorization() {
        AuthService.verify(FakeHttpRequest.withHeaders(PartnerIntegrationService.KEY_HEADER, "bad-key"),
                AuthLevel.AUTHENTICATED);
    }

    @Test(expected = AuthenticationException.class)
    public void authenticatedEndpoint_rejectsMissingAuthorizationHeader() {
        AuthService.verify(FakeHttpRequest.withHeaders(), AuthLevel.AUTHENTICATED);
    }

    @Test(expected = AuthenticationException.class)
    public void authenticatedEndpoint_rejectsNonBearerScheme() {
        AuthService.verify(
                FakeHttpRequest.withHeaders("Authorization", "Basic dXNlcjpwYXNz"), AuthLevel.AUTHENTICATED);
    }

    @Test(expected = AuthenticationException.class)
    public void authenticatedEndpoint_rejectsBlankBearerToken() {
        AuthService.verify(FakeHttpRequest.withHeaders("Authorization", "Bearer    "), AuthLevel.AUTHENTICATED);
    }
}
