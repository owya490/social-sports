package com.functions.global.models;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;

import org.junit.Test;

import com.functions.global.exceptions.AuthenticationException;
import com.functions.partners.models.PartnerContext;

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
        assertNull(context.partnerContext());
    }

    @Test
    public void partnerIdentityCannotSubstituteForFirebaseIdentity() {
        PartnerContext partner = new PartnerContext("partner-one", "owner-one", "https://partner.example");
        AuthContext context = AuthContext.partner(partner);

        assertEquals(AuthLevel.PARTNER, context.level());
        assertEquals(partner, context.requirePartner());
        assertNull(context.uid());
        expectFailure(AuthenticationException.class, context::requireUid);
        expectFailure(AuthenticationException.class, AuthContext.anonymous()::requirePartner);
        expectFailure(AuthenticationException.class, AuthContext.authenticated("uid-1")::requirePartner);
    }

    @Test
    public void constructorRejectsMissingAndHybridIdentities() {
        PartnerContext partner = new PartnerContext("partner-one", "owner-one", "https://partner.example");
        expectFailure(IllegalArgumentException.class, () -> new AuthContext(null, null, null));
        expectFailure(IllegalArgumentException.class, () -> new AuthContext(AuthLevel.PUBLIC, "uid", null));
        expectFailure(IllegalArgumentException.class, () -> new AuthContext(AuthLevel.PUBLIC, null, partner));
        expectFailure(IllegalArgumentException.class, () -> AuthContext.authenticated(" "));
        expectFailure(IllegalArgumentException.class, () -> AuthContext.authenticated(null));
        expectFailure(IllegalArgumentException.class, () -> new AuthContext(AuthLevel.AUTHENTICATED, "uid", partner));
        expectFailure(IllegalArgumentException.class, () -> AuthContext.partner(null));
        expectFailure(IllegalArgumentException.class, () -> new AuthContext(AuthLevel.PARTNER, "uid", partner));
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

    private <T extends RuntimeException> T expectFailure(Class<T> expected, Runnable action) {
        try {
            action.run();
        } catch (RuntimeException failure) {
            if (!expected.isInstance(failure)) {
                throw failure;
            }
            return expected.cast(failure);
        }
        throw new AssertionError("Expected " + expected.getSimpleName());
    }
}
