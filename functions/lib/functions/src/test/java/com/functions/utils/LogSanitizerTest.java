package com.functions.utils;

import static org.junit.Assert.assertEquals;

import org.junit.Test;

public class LogSanitizerTest {
    @Test
    public void redactEmailMasksNormalEmailAddresses() {
        assertEquals("b***@***", LogSanitizer.redactEmail("brian@example.com"));
    }

    @Test
    public void redactEmailFallsBackForBlankOrMalformedValues() {
        assertEquals("[redacted-email]", LogSanitizer.redactEmail(null));
        assertEquals("[redacted-email]", LogSanitizer.redactEmail(" "));
        assertEquals("[redacted-email]", LogSanitizer.redactEmail("not-an-email"));
    }
}
