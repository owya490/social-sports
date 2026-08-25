package com.functions.global.services;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;

import org.junit.Test;

import com.functions.global.exceptions.AuthenticationException;
import com.functions.global.models.AuthContext;
import com.functions.global.models.AuthLevel;
import com.functions.global.testutils.FakeHttpRequest;

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
                FakeHttpRequest.withHeaders("Authorization", "Bearer not-a-real-token"), AuthLevel.PUBLIC);

        assertEquals(AuthLevel.PUBLIC, context.level());
        assertNull(context.uid());
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
