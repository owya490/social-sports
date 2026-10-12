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
    public void truncate_isPlainCutWithoutSentenceTrim() {
        String result = SmsText.truncate("Checkout failed. Stripe checkout expired later.", 20);
        assertEquals("Checkout failed. Str", result);
        assertFalse(result.endsWith("..."));
    }

    @Test
    public void truncate_doesNotSentenceTrimNearbyStyleBlobs() {
        String nearby = "ERROR WebhookService.process failed after retry";
        assertEquals(nearby.substring(0, 25), SmsText.truncate(nearby, 25));
        assertEquals("sendEmailOnCreateEvent", SmsText.truncate("sendEmailOnCreateEvent", 100));
    }

    @Test
    public void truncate_nullIsEmpty() {
        assertEquals("", SmsText.truncate(null));
    }

    @Test
    public void truncate_defaultLimitIs480() {
        String result = SmsText.truncate("word ".repeat(200).trim());
        assertEquals(SmsText.MAX_CHARS, result.length());
        assertFalse(result.endsWith("..."));
    }

    @Test
    public void forSms_capsAt480CharsNot255Bytes() {
        String body = "word ".repeat(200).trim();
        String result = SmsText.forSms(body);
        assertTrue(result.length() <= SmsText.MAX_CHARS);
        assertTrue(result.length() > 255);
        assertFalse(result.endsWith("..."));
    }

    @Test
    public void forSmsSubject_capsUtf8BytesForMonitoringSubject() {
        String result = SmsText.forSmsSubject("é".repeat(200));
        assertTrue(result.getBytes(StandardCharsets.UTF_8).length <= SmsText.MAX_UTF8_BYTES);
        assertTrue(result.startsWith("é"));
    }

    @Test
    public void forSms_keepsShortEarlySentenceWhenLaterTextFits480() {
        String overflow = "Request failed. " + "This looks like a Stripe checkout timeout at WebhookService.process. ".repeat(8);
        String result = SmsText.forSms(overflow);
        assertTrue(result.contains("Stripe checkout timeout"));
        assertTrue(result.length() <= SmsText.MAX_CHARS);
    }

    @Test
    public void forSmsSubject_keepsAnyCompleteAiSentenceInBudget() {
        String overflow = "Request failed. This looks like a Stripe checkout timeout at WebhookService.process "
                + "and then more overflow words continue ".repeat(20);
        String result = SmsText.forSmsSubject(overflow);
        assertTrue(result.endsWith("."));
        assertFalse(result.endsWith("..."));
        assertTrue(result.getBytes(StandardCharsets.UTF_8).length <= SmsText.MAX_UTF8_BYTES);
        assertFalse(result.contains(" and persist the"));
    }

    @Test
    public void forSmsSubject_keepsShortFirstSentenceOfTwoSentenceCheckoutFailure() {
        String interpretation = twoSentenceCheckoutFailure(303);
        assertEquals(303, interpretation.getBytes(StandardCharsets.UTF_8).length);
        String result = SmsText.forSmsSubject(interpretation);
        assertEquals("Checkout failed in globalAppController.", result);
        assertFalse(result.contains("..."));
        assertFalse(result.contains("and persist the"));
        assertTrue(result.endsWith("."));
    }

    @Test
    public void forHeadline_doesNotCollapseSpacelessBlobToFunctionName() {
        String blob = "a".repeat(400);
        String result = SmsText.forHeadline("createEvent: " + blob);
        assertFalse(result.equals("createEvent:"));
        assertFalse(result.equals("createEvent"));
        assertTrue(result.startsWith("createEvent: "));
        assertTrue(result.contains("aaa"));
        assertTrue(result.endsWith("..."));
        assertTrue(result.getBytes(StandardCharsets.UTF_8).length <= SmsText.MAX_UTF8_BYTES);
    }

    @Test
    public void forSms_doesNotCutMidWordLikeStripeCheckoWhenSentenceFitsBudget() {
        String sentence = "Checkout failed in globalAppController.";
        String cut = sentence + " Stripe checko" + "ut session expired without a later period "
                + "overflow ".repeat(50);
        String result = SmsText.forSms(cut);
        assertTrue(result.contains("Checkout failed"));
        assertFalse(result.contains("Stripe checko "));
        assertFalse(result.endsWith("checko"));
        assertFalse(result.endsWith("..."));
    }

    @Test
    public void lastWordEnd_keepsWordWhenCutLandsOnItsEnd() {
        String original = "hello world foo";
        String prefix = original.substring(0, 11);
        assertEquals("hello world", prefix);
        assertEquals(11, SmsText.lastWordEnd(prefix, original));
    }

    @Test
    public void forSmsSubject_doesNotTreatAbbreviationsAsSentenceEnds() {
        String text = "Timeout e.g. Stripe checkout vs. WebhookService and i.e. session expiry "
                + "overflow ".repeat(40);
        String result = SmsText.forSmsSubject(text);
        assertFalse(result.equals("Timeout e.g."));
        assertFalse(result.equals("Timeout e.g. Stripe checkout vs."));
        assertTrue(result.contains("Stripe checkout"));
        assertTrue(result.contains("vs. WebhookService") || result.contains("WebhookService"));
    }

    @Test
    public void forSms_doesNotTreatClassMethodDotsAsSentenceEnds() {
        String text = "globalAppController failed during checkout at WebhookService.process "
                + "and then more overflow words continue ".repeat(20);
        String result = SmsText.forSms(text);
        assertTrue(result.contains("WebhookService.process"));
        assertFalse(result.equals("globalAppController failed during checkout at WebhookService"));
        assertFalse(result.endsWith("WebhookService."));
    }

    @Test
    public void forSmsSubject_doesNotTreatClassMethodDotsAsSentenceEndsWhenCutLandsOnThePeriod() {
        String marker = "WebhookService.";
        String pad = "word ".repeat((SmsText.MAX_UTF8_BYTES - marker.length()) / 5)
                + "x".repeat((SmsText.MAX_UTF8_BYTES - marker.length()) % 5);
        String falseSentence = pad + "WebhookService.";
        assertEquals(SmsText.MAX_UTF8_BYTES, falseSentence.length());
        String result = SmsText.forSmsSubject(falseSentence + "process overflow continues after the class name");
        assertFalse(result.equals(falseSentence.trim()));
        assertFalse(result.endsWith("WebhookService."));
        assertTrue(result.getBytes(StandardCharsets.UTF_8).length <= SmsText.MAX_UTF8_BYTES);
    }

    @Test
    public void forHeadline_keepsASentenceOnlyWhenItUsesAtLeastSixtyPercentOfTheBudget() {
        int minKeep = (int) Math.ceil(SmsText.MAX_UTF8_BYTES * 0.6);
        String tooShort = "A".repeat(minKeep - 2) + ".";
        String longEnough = "B".repeat(minKeep - 1) + ".";
        String overflow = " extra overflow words continue after the period ".repeat(20);
        String skipped = SmsText.forHeadline(tooShort + overflow);
        String kept = SmsText.forHeadline(longEnough + overflow);
        assertFalse(skipped.equals(tooShort));
        assertEquals(longEnough, kept);
        assertTrue(skipped.getBytes(StandardCharsets.UTF_8).length <= SmsText.MAX_UTF8_BYTES);
        assertTrue(kept.getBytes(StandardCharsets.UTF_8).length <= SmsText.MAX_UTF8_BYTES);
    }

    @Test
    public void forSmsSubject_keepsAShortCompleteSentenceUnderSixtyPercent() {
        int minKeep = (int) Math.ceil(SmsText.MAX_UTF8_BYTES * 0.6);
        String tooShortForHeadline = "A".repeat(minKeep - 2) + ".";
        String overflow = " extra overflow words continue after the period ".repeat(20);
        assertEquals(tooShortForHeadline, SmsText.forSmsSubject(tooShortForHeadline + overflow));
    }

    @Test
    public void forSmsSubject_is255WhileForSmsIs480() {
        String text = "Checkout failed in globalAppController while the webhook was still running. "
                + "This looks like a Stripe checkout timeout at WebhookService.process. "
                + "Check the expired session and the fulfillment logs next. "
                + "Inspect the matching payment intent after that. ".repeat(8);
        String subject = SmsText.forSmsSubject(text);
        String body = SmsText.forSms(text);
        assertTrue(body.length() > subject.length());
        assertTrue(subject.endsWith("."));
        assertTrue(subject.getBytes(StandardCharsets.UTF_8).length <= SmsText.MAX_UTF8_BYTES);
        assertTrue(body.length() <= SmsText.MAX_CHARS);
    }

    static String twoSentenceCheckoutFailure(int totalBytes) {
        String first = "Checkout failed in globalAppController. ";
        StringBuilder second = new StringBuilder(
                "This looks like a Stripe checkout timeout at WebhookService.process and persist the");
        while (first.getBytes(StandardCharsets.UTF_8).length
                + second.toString().getBytes(StandardCharsets.UTF_8).length + 1 < totalBytes) {
            second.append('x');
        }
        return first + second + ".";
    }
}
