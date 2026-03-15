package com.functions.emails;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import java.util.Map;
import java.util.Optional;

import org.junit.Test;

public class EmailServiceTest {
    @Test
    public void extractContactEmailReturnsEmailWhenPresent() {
        Optional<String> result = EmailService.extractContactEmail(Map.of("email", "organiser@example.com"));

        assertTrue(result.isPresent());
        assertEquals("organiser@example.com", result.get());
    }

    @Test
    public void extractContactEmailReturnsEmptyForMissingBlankOrMalformedValues() {
        assertFalse(EmailService.extractContactEmail(null).isPresent());
        assertFalse(EmailService.extractContactEmail(Map.of()).isPresent());
        assertFalse(EmailService.extractContactEmail(Map.of("email", "")).isPresent());
        assertFalse(EmailService.extractContactEmail(Map.of("email", 123)).isPresent());
    }
}
