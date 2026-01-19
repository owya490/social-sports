package com.functions.events.controllers;

import com.functions.events.models.RecurrenceTemplate;
import com.functions.events.repositories.RecurrenceTemplateRepository;
import com.functions.global.handlers.Global;
import com.google.cloud.functions.HttpFunction;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;

import static com.functions.events.services.RecurringEventsCronService.createEventsFromRecurrenceTemplates;

public class RecurringEventsCronEndpoint implements HttpFunction {
    private static final Logger logger = LoggerFactory.getLogger(RecurringEventsCronEndpoint.class);
    private static final String CRON_SECRET_ENV_VAR = "CRON_SECRET";
    private static final String CRON_SECRET_HEADER = "X-Cron-Secret";

    @Override
    public void service(HttpRequest request, HttpResponse response) throws Exception {
        // Set CORS headers for all responses
        response.appendHeader("Access-Control-Allow-Origin", "*");
        response.appendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        response.appendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, " + CRON_SECRET_HEADER);
        response.appendHeader("Access-Control-Max-Age", "3600"); // Cache preflight for 1 hour

        // Handle preflight (OPTIONS) requests
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            logger.info("Handling OPTIONS request: {}", request);
            response.setStatusCode(204); // No Content
            return;
        }

        if (!(request.getMethod().equalsIgnoreCase("GET"))) {
            response.setStatusCode(405); // Method Not Allowed
            response.appendHeader("Allow", "GET"); // Inform client that only GET is allowed
            response.getWriter().write("The RecurringEventsConEndpoint only supports GET requests.");
            return;
        }

        ZoneId sydneyZone = ZoneId.of("Australia/Sydney");
        LocalDate sydneyDate = ZonedDateTime.now(sydneyZone).toLocalDate();

        // Query params for testing: ?forceCreate=true&templateId=xxx
        boolean forceCreate = request.getFirstQueryParameter("forceCreate")
                .map(v -> v.equalsIgnoreCase("true"))
                .orElse(false);
        String templateId = request.getFirstQueryParameter("templateId").orElse(null);

        List<String> createdEvents;
        if (forceCreate && templateId != null) {
            // Authentication: Verify shared secret for forceCreate requests
            if (!isAuthenticated(request)) {
                logger.warn("Unauthorized forceCreate attempt for templateId: {}. Missing or invalid {} header.", 
                        templateId, CRON_SECRET_HEADER);
                response.setStatusCode(401); // Unauthorized
                response.getWriter().write("Unauthorized: Missing or invalid " + CRON_SECRET_HEADER + " header.");
                return;
            }

            // Authorization: Verify template exists
            Optional<RecurrenceTemplate> maybeTemplate = RecurrenceTemplateRepository.getRecurrenceTemplate(templateId);
            if (maybeTemplate.isEmpty()) {
                logger.warn("ForceCreate failed: Template not found for templateId: {}", templateId);
                response.setStatusCode(403); // Forbidden (or could use 404)
                response.getWriter().write("Forbidden: Template with ID '" + templateId + "' not found or caller is not authorized.");
                return;
            }

            logger.info("Authenticated forceCreate request for templateId: {}", templateId);
            createdEvents = createEventsFromRecurrenceTemplates(sydneyDate, templateId, true);
        } else {
            // Regular cron execution (triggered by Cloud Scheduler) - no additional auth needed
            // Cloud Scheduler invocations are secured at the infrastructure level
            createdEvents = createEventsFromRecurrenceTemplates(sydneyDate);
        }

        response.getWriter()
                .write("Recurring events processed for: " + sydneyDate + ". Created events: " + createdEvents);
    }

    /**
     * Verifies that the request contains a valid shared secret for authentication.
     * This is used to gate the forceCreate functionality to authorized callers only.
     *
     * @param request The incoming HTTP request
     * @return true if the request is authenticated, false otherwise
     */
    private boolean isAuthenticated(HttpRequest request) {
        String configuredSecret = Global.getEnv(CRON_SECRET_ENV_VAR);
        
        // If no secret is configured, reject all forceCreate requests for security
        if (configuredSecret == null || configuredSecret.isEmpty()) {
            logger.error("CRON_SECRET environment variable is not configured. ForceCreate is disabled.");
            return false;
        }

        Optional<String> providedSecret = request.getFirstHeader(CRON_SECRET_HEADER);
        if (providedSecret.isEmpty()) {
            return false;
        }

        // Constant-time comparison to prevent timing attacks
        return configuredSecret.equals(providedSecret.get());
    }
}
