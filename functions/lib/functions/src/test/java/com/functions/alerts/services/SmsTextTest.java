package com.functions.alerts.services;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

public class SmsTextTest {

    @Test
    public void truncate_collapsesWhitespaceAndCapsLength() {
        String result = SmsText.truncate("hello\n\nworld   again", 20);
        assertEquals("hello world again", result);
    }

    @Test
    public void truncate_addsEllipsisWhenOverLimit() {
        String result = SmsText.truncate("abcdefghijklmnopqrstuvwxyz", 10);
        assertEquals(10, result.length());
        assertTrue(result.endsWith("..."));
    }

    @Test
    public void truncate_nullIsEmpty() {
        assertEquals("", SmsText.truncate(null));
    }

    @Test
    public void truncate_defaultLimitIs320() {
        String result = SmsText.truncate("x".repeat(500));
        assertEquals(SmsText.MAX_CHARS, result.length());
    }
}
