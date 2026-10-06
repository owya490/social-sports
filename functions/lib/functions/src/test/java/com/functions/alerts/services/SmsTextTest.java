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
    public void truncate_defaultLimitIs480() {
        String result = SmsText.truncate("x".repeat(600));
        assertEquals(SmsText.MAX_CHARS, result.length());
        assertEquals(480, result.length());
    }

    @Test
    public void forSms_keepsThreeSegmentSummaryWithoutUtf8SubjectCap() {
        String body = "é".repeat(200);
        String result = SmsText.forSms(body);
        assertEquals(200, result.length());
        assertTrue(result.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > SmsText.MAX_UTF8_BYTES);
    }

    @Test
    public void forSms_truncatesAt480Characters() {
        String result = SmsText.forSms("x".repeat(600));
        assertEquals(SmsText.MAX_CHARS, result.length());
        assertTrue(result.endsWith("..."));
    }

    @Test
    public void forSmsSubject_capsUtf8BytesForMonitoringSubject() {
        String result = SmsText.forSmsSubject("é".repeat(200));
        assertTrue(result.getBytes(java.nio.charset.StandardCharsets.UTF_8).length <= SmsText.MAX_UTF8_BYTES);
        assertTrue(result.endsWith("..."));
    }
}
