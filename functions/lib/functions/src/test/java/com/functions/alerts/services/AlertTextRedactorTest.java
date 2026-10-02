package com.functions.alerts.services;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class AlertTextRedactorTest {

    @Test
    public void redact_stripsEmailAndStripeSecret() {
        String redacted = AlertTextRedactor.redact(
                "EmailService failed for ada@sportshub.net token=sk_live_abcDEF123");
        assertTrue(redacted.contains("[REDACTED_EMAIL]"));
        assertTrue(redacted.contains("[REDACTED]"));
        assertTrue(!redacted.contains("ada@sportshub.net"));
        assertTrue(!redacted.contains("sk_live_abcDEF123"));
    }

    @Test
    public void redact_stripsBearerAndJwt() {
        String jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0In0.abc";
        String redacted = AlertTextRedactor.redact("Authorization: Bearer abc.def-ghi " + jwt);
        assertTrue(redacted.contains("[REDACTED_TOKEN]"));
        assertTrue(redacted.contains("[REDACTED_JWT]"));
        assertTrue(!redacted.contains("abc.def-ghi"));
    }

    @Test
    public void redact_nullIsEmpty() {
        assertEquals("", AlertTextRedactor.redact(null));
    }
}
