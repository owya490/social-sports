package com.functions.alerts.services;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import java.nio.charset.StandardCharsets;

import org.junit.Test;

public class SmsTextTest {

    @Test
    public void truncate_collapsesWhitespaceAndCapsLength() {
        String result = SmsText.truncate("hello\n\nworld   again", 20);
        assertEquals("hello world again", result);
    }

    @Test
    public void truncate_usesSentenceBoundaryInsteadOfEllipsis() {
        String result = SmsText.truncate("Checkout failed. Stripe checkout expired later.", 20);
        assertEquals("Checkout failed.", result);
        assertFalse(result.endsWith("..."));
    }

    @Test
    public void truncate_nullIsEmpty() {
        assertEquals("", SmsText.truncate(null));
    }

    @Test
    public void truncate_defaultLimitIs480() {
        String result = SmsText.truncate("word ".repeat(200).trim());
        assertTrue(result.length() <= SmsText.MAX_CHARS);
        assertFalse(result.endsWith("..."));
        assertFalse(result.endsWith(" "));
    }

    @Test
    public void forSms_capsUtf8BytesForMonitoringSubject() {
        String body = "é".repeat(200);
        String result = SmsText.forSms(body);
        assertTrue(result.getBytes(StandardCharsets.UTF_8).length <= SmsText.MAX_UTF8_BYTES);
        assertFalse(result.endsWith("..."));
    }

    @Test
    public void forSms_trimsToLastCompleteSentenceWithin255Utf8Bytes() {
        String first = "Checkout failed in globalAppController.";
        String second = "This looks like a Stripe checkout timeout at WebhookService.process.";
        String third = "Check the expired session and retry the webhook fulfillment.";
        String overflow = first + " " + second + " " + third + " Extra filler words keep going past the cap "
                + "word ".repeat(40);
        String result = SmsText.forSms(overflow);

        assertTrue(result.getBytes(StandardCharsets.UTF_8).length <= SmsText.MAX_UTF8_BYTES);
        assertTrue(result.endsWith("."));
        assertFalse(result.endsWith("..."));
        assertTrue(result.contains(first));
        assertFalse(result.contains("Extra filler"));
    }

    @Test
    public void forSms_doesNotCutMidWordLikeStripeChecko() {
        String sentence = "Checkout failed in globalAppController.";
        String cut = sentence + " Stripe checko" + "ut session expired without a later period "
                + "overflow ".repeat(50);
        String result = SmsText.forSms(cut);

        assertEquals(sentence, result);
        assertFalse(result.contains("Stripe checko"));
        assertFalse(result.endsWith("..."));
        assertTrue(result.getBytes(StandardCharsets.UTF_8).length <= SmsText.MAX_UTF8_BYTES);
    }

    @Test
    public void forSms_trimsToLastCompleteWordWhenNoPeriod() {
        String result = SmsText.forSms("Stripe checkout session expired without a terminal period "
                + "overflow ".repeat(40));
        assertFalse(result.endsWith("..."));
        assertFalse(result.endsWith(" "));
        assertTrue(result.getBytes(StandardCharsets.UTF_8).length <= SmsText.MAX_UTF8_BYTES);
        assertTrue(result.startsWith("Stripe checkout"));
        assertFalse(result.matches(".*\\S$") && result.endsWith("overfl"));
    }

    @Test
    public void forSmsSubject_matchesPrimarySmsLine() {
        String text = "Checkout failed. This looks like a timeout at WebhookService.process. Check Stripe.";
        assertEquals(SmsText.forSms(text), SmsText.forSmsSubject(text));
        assertTrue(SmsText.forSmsSubject("é".repeat(200)).getBytes(StandardCharsets.UTF_8).length
                <= SmsText.MAX_UTF8_BYTES);
    }

    @Test
    public void forSms_doesNotTreatClassMethodDotsAsSentenceEnds() {
        String text = "globalAppController failed during checkout at WebhookService.process "
                + "and then more overflow words continue ".repeat(20);
        String result = SmsText.forSms(text);
        assertFalse(result.equals("globalAppController failed during checkout at WebhookService"));
        assertTrue(result.contains("WebhookService.process") || result.endsWith("process")
                || result.contains("checkout"));
        assertFalse(result.endsWith("..."));
    }
}
