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

    @Test
    public void buildPurchaseEmailVariablesMatchesPythonTemplateContract() {
        Map<String, String> variables = EmailService.buildPurchaseEmailVariables(
                "Taylor",
                "Friday Social",
                "order-123",
                "2",
                1250.0,
                "03/31/2026, 20:00",
                "04/01/2026, 18:00",
                "04/01/2026, 20:00",
                "Sydney");

        assertEquals("Taylor", variables.get("name"));
        assertEquals("Friday Social", variables.get("eventName"));
        assertEquals("order-123", variables.get("orderId"));
        assertEquals("https://www.sportshub.net.au/order/order-123", variables.get("orderLink"));
        assertEquals("03/31/2026, 20:00", variables.get("datePurchased"));
        assertEquals("2", variables.get("quantity"));
        assertEquals("12.5", variables.get("price"));
        assertEquals("04/01/2026, 18:00", variables.get("startDate"));
        assertEquals("04/01/2026, 20:00", variables.get("endDate"));
        assertEquals("Sydney", variables.get("location"));
    }

    @Test
    public void centsToPurchaseEmailPriceReturnsBareNumericString() {
        assertEquals("12.5", EmailService.centsToPurchaseEmailPrice(1250.0));
        assertEquals("12.0", EmailService.centsToPurchaseEmailPrice(1200.0));
        assertEquals("0.0", EmailService.centsToPurchaseEmailPrice(null));
    }

    @Test
    public void resolveCancellationEmailTemplateIdFallsBackToPythonTemplateWhenUnset() {
        assertEquals("cml0rm3t21e8s0ixa21rvcfnx", EmailService.resolveCancellationEmailTemplateId(null));
        assertEquals("cml0rm3t21e8s0ixa21rvcfnx", EmailService.resolveCancellationEmailTemplateId(""));
        assertEquals("custom-template", EmailService.resolveCancellationEmailTemplateId("custom-template"));
    }

    @Test
    public void sendPurchaseEmailCopyToOrganiserReturnsTrueWhenOrganiserEmailMissing() {
        boolean result = EmailService.sendPurchaseEmailCopyToOrganiser(
                Optional.empty(),
                "organiser-123",
                Map.of("orderId", "order-123"),
                (templateType, email, variables) -> false);

        assertTrue(result);
    }

    @Test
    public void sendPurchaseEmailCopyToOrganiserReturnsFalseWhenSendFails() {
        boolean result = EmailService.sendPurchaseEmailCopyToOrganiser(
                Optional.of("organiser@example.com"),
                "organiser-123",
                Map.of("orderId", "order-123"),
                (templateType, email, variables) -> false);

        assertFalse(result);
    }

    @Test
    public void sendPurchaseEmailCopyToOrganiserReturnsTrueWhenSendSucceeds() {
        boolean result = EmailService.sendPurchaseEmailCopyToOrganiser(
                Optional.of("organiser@example.com"),
                "organiser-123",
                Map.of("orderId", "order-123"),
                (templateType, email, variables) -> true);

        assertTrue(result);
    }
}
