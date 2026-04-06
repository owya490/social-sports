package com.functions.emails;

import static org.junit.Assert.assertFalse;

import java.util.Map;

import org.junit.Test;

public class EmailClientTest {
    @Test
    public void sendEmailWithLoopsWithRetriesReturnsFalseWhenTemplateTypeIsNull() {
        assertFalse(EmailClient.sendEmailWithLoopsWithRetries(
                (EmailTemplateType) null,
                "buyer@example.com",
                Map.of()));
    }

    @Test
    public void sendEmailWithLoopsWithRetriesReturnsFalseWhenTransactionalIdIsNullOrBlank() {
        assertFalse(EmailClient.sendEmailWithLoopsWithRetries(
                (String) null,
                "buyer@example.com",
                Map.of()));
        assertFalse(EmailClient.sendEmailWithLoopsWithRetries(
                "   ",
                "buyer@example.com",
                Map.of()));
    }
}
