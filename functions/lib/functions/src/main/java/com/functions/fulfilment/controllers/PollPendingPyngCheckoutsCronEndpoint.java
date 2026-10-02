package com.functions.fulfilment.controllers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.fulfilment.pyng.PyngCheckoutCompletion;
import com.functions.fulfilment.pyng.PyngCheckoutCompletion.PollPendingPyngCheckoutsResult;
import com.functions.global.controllers.AbstractConfiguredHttpFunction;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;

/**
 * Cron endpoint that polls unfinished Pyng hosted checkouts.
 *
 * <p>Designed to be triggered by Cloud Scheduler every minute. Checkout state is
 * read from Firestore on each run, so the poll survives a function restart.
 */
public class PollPendingPyngCheckoutsCronEndpoint extends AbstractConfiguredHttpFunction {
    private static final Logger logger = LoggerFactory.getLogger(PollPendingPyngCheckoutsCronEndpoint.class);

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
            response.getWriter().write(
                    "The PollPendingPyngCheckoutsCronEndpoint only supports GET requests.");
            return;
        }

        PollPendingPyngCheckoutsResult result = null;
        Throwable pollError = null;

        try {
            result = PyngCheckoutCompletion.pollPendingCheckouts();
            logger.info("Pyng checkout poll pass complete. checked={}, resumed={}, errors={}",
                    result.checked(), result.resumed(), result.errors());
        } catch (Exception e) {
            pollError = e;
            logger.error("Error during Pyng checkout poll pass", e);
        }

        if (pollError != null) {
            response.setStatusCode(500);
            response.getWriter().write("Pyng checkout poll pass failed: " + pollError.getMessage());
            return;
        }

        response.setStatusCode(200);
        response.getWriter().write(String.format(
                "{\"checked\":%d,\"resumed\":%d,\"errors\":%d}",
                result.checked(), result.resumed(), result.errors()));
    }
}
