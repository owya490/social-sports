package com.functions.global.models;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

import com.functions.global.exceptions.AuthenticationException;

public class AuthContextTest {

    @Test
    public void authenticatedContext_exposesUid() {
        assertEquals("uid-1", AuthContext.authenticated("uid-1").requireUid());
    }

    @Test
    public void sessionContext_exposesSecret() {
        assertEquals("secret-1", AuthContext.session("secret-1").requireSessionSecret());
    }

    /**
     * These must be AuthenticationException (401), not IllegalStateException. A
     * handler that asks for a uid while running under a PUBLIC endpoint is an auth
     * failure that should fail closed, not a 500 that hides the misconfiguration
     * behind "Internal server error".
     */
    @Test(expected = AuthenticationException.class)
    public void requireUid_throwsAuthenticationExceptionWhenAnonymous() {
        AuthContext.anonymous().requireUid();
    }

    @Test(expected = AuthenticationException.class)
    public void requireSessionSecret_throwsAuthenticationExceptionWhenAnonymous() {
        AuthContext.anonymous().requireSessionSecret();
    }

    @Test(expected = AuthenticationException.class)
    public void requireUid_throwsWhenContextOnlyHasSessionSecret() {
        AuthContext.session("secret-1").requireUid();
    }

    @Test(expected = AuthenticationException.class)
    public void requireSessionSecret_throwsWhenContextOnlyHasUid() {
        AuthContext.authenticated("uid-1").requireSessionSecret();
    }
}
