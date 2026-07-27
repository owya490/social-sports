package com.functions.global.services;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;

import org.junit.Test;

import com.functions.global.exceptions.AuthenticationException;
import com.functions.global.models.AuthContext;
import com.functions.global.models.AuthLevel;
import com.functions.global.testutils.FakeHttpRequest;

public class AuthServiceTest {

    @Test
    public void publicEndpoint_doesNotRequireAnyCredential() {
        AuthContext context = AuthService.verify(FakeHttpRequest.withHeaders(), AuthLevel.PUBLIC);

        assertEquals(AuthLevel.PUBLIC, context.level());
        assertNull(context.uid());
        assertNull(context.sessionSecret());
    }

    @Test
    public void sessionEndpoint_readsSecretFromHeader() {
        AuthContext context = AuthService.verify(
                FakeHttpRequest.withHeaders("X-Session-Secret", "secret-123"), AuthLevel.SESSION);

        assertEquals(AuthLevel.SESSION, context.level());
        assertEquals("secret-123", context.sessionSecret());
    }

    /** Cloud Run serves HTTP/2, which lowercases header names. */
    @Test
    public void sessionEndpoint_headerLookupIsCaseInsensitive() {
        AuthContext context = AuthService.verify(
                FakeHttpRequest.withHeaders("x-session-secret", "secret-123"), AuthLevel.SESSION);

        assertEquals("secret-123", context.sessionSecret());
    }

    @Test(expected = AuthenticationException.class)
    public void sessionEndpoint_rejectsMissingSecret() {
        AuthService.verify(FakeHttpRequest.withHeaders(), AuthLevel.SESSION);
    }

    @Test(expected = AuthenticationException.class)
    public void sessionEndpoint_rejectsBlankSecret() {
        AuthService.verify(FakeHttpRequest.withHeaders("X-Session-Secret", "   "), AuthLevel.SESSION);
    }

    /**
     * Regression guard. The secret used to be accepted from a cookie, which could
     * never work: the browser calls this function cross-site, so a SameSite=Lax
     * cookie is never sent. Reinstating it would also force credentialed CORS,
     * which is incompatible with the wildcard Access-Control-Allow-Origin the
     * controller returns.
     */
    @Test(expected = AuthenticationException.class)
    public void sessionEndpoint_doesNotAcceptSecretFromCookie() {
        AuthService.verify(
                FakeHttpRequest.withHeaders("Cookie", "fulfilmentSessionSecret=secret-123"), AuthLevel.SESSION);
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
    public void authenticatedEndpoint_rejectsEmptyBearerToken() {
        AuthService.verify(FakeHttpRequest.withHeaders("Authorization", "Bearer    "), AuthLevel.AUTHENTICATED);
    }

    /**
     * A session secret must not stand in for a signed-in user on an AUTHENTICATED
     * endpoint.
     */
    @Test(expected = AuthenticationException.class)
    public void authenticatedEndpoint_rejectsSessionSecretInsteadOfToken() {
        AuthService.verify(
                FakeHttpRequest.withHeaders("X-Session-Secret", "secret-123"), AuthLevel.AUTHENTICATED);
    }
}
