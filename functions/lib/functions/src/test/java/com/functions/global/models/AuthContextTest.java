package com.functions.global.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;

import org.junit.Test;

import com.functions.global.exceptions.AuthenticationException;

public class AuthContextTest {

    @Test
    public void anonymous_hasPublicLevelAndNoUid() {
        AuthContext context = AuthContext.anonymous();

        assertEquals(AuthLevel.PUBLIC, context.level());
        assertNull(context.uid());
    }

    @Test
    public void authenticatedContext_exposesUid() {
        AuthContext context = AuthContext.authenticated("uid-1");

        assertEquals(AuthLevel.AUTHENTICATED, context.level());
        assertEquals("uid-1", context.requireUid());
    }

    /**
     * This must be AuthenticationException (401), not IllegalStateException. A
     * handler that asks for a uid while running under a PUBLIC endpoint is an auth
     * failure that should fail closed, not a 500 that hides the misconfiguration
     * behind "Internal server error".
     */
    @Test(expected = AuthenticationException.class)
    public void requireUid_throwsAuthenticationExceptionWhenAnonymous() {
        AuthContext.anonymous().requireUid();
    }
}
