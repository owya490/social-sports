package com.functions.events.controllers;

import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.events.services.MoveInactiveEventsService;
import com.functions.firebase.services.FirebaseService;
import com.functions.global.controllers.AbstractConfiguredHttpFunction;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;

public class MoveInactiveEventsCronEndpoint extends AbstractConfiguredHttpFunction {
    private static final Logger logger = LoggerFactory.getLogger(MoveInactiveEventsCronEndpoint.class);

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
            response.getWriter().write("The MoveInactiveEventsCronEndpoint only supports GET requests.");
            return;
        }

        String result = MoveInactiveEventsService.moveInactiveEvents(
                FirebaseService.getFirestore(),
                MoveInactiveEventsService.sydneyDate(Instant.now()));
        response.getWriter().write(result);
    }
}
