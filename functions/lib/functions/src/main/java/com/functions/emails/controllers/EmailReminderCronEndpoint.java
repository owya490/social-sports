package com.functions.emails.controllers;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.emails.reminder.EmailReminderJob;
import com.functions.emails.reminder.EmailReminderResult;
import com.functions.emails.reminder.EmailReminderService;
import com.functions.global.controllers.AbstractConfiguredHttpFunction;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;

/**
 * Daily cron that emails approved purchasers of events starting tomorrow in Sydney.
 */
public class EmailReminderCronEndpoint extends AbstractConfiguredHttpFunction {
    private static final Logger logger = LoggerFactory.getLogger(EmailReminderCronEndpoint.class);
    private static final ZoneId SYDNEY = ZoneId.of("Australia/Sydney");

    private final EmailReminderJob job;
    private final Clock clock;

    public EmailReminderCronEndpoint() {
        this(EmailReminderService.production(), Clock.system(SYDNEY));
    }

    EmailReminderCronEndpoint(EmailReminderJob job, Clock clock) {
        this.job = job;
        this.clock = clock;
    }

    @Override
    public void service(HttpRequest request, HttpResponse response) throws Exception {
        response.appendHeader("Access-Control-Allow-Origin", "*");
        response.appendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        response.appendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        response.appendHeader("Access-Control-Max-Age", "3600");

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            logger.info("Handling OPTIONS request: {}", request);
            response.setStatusCode(204);
            return;
        }

        if (!request.getMethod().equalsIgnoreCase("GET")) {
            response.setStatusCode(405);
            response.appendHeader("Allow", "GET");
            response.getWriter().write("The EmailReminderCronEndpoint only supports GET requests.");
            return;
        }

        LocalDate tomorrow = LocalDate.now(clock).plusDays(1);
        try {
            EmailReminderResult result = job.sendFor(tomorrow);
            logger.info("Reminder pass complete. date={} events={} sent={} failed={}",
                    result.eventDate(), result.eventIds().size(), result.sent(), result.failed());
            response.setStatusCode(200);
            response.getWriter().write(String.format(
                    "{\"eventDate\":\"%s\",\"events\":%d,\"sent\":%d,\"failed\":%d}",
                    result.eventDate(),
                    result.eventIds().size(),
                    result.sent(),
                    result.failed()));
        } catch (Exception e) {
            logger.error("Error during email reminder pass", e);
            response.setStatusCode(500);
            response.getWriter().write("Email reminder pass failed: " + e.getMessage());
        }
    }
}
