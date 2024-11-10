package com.functions.events.controllers;

import com.functions.events.models.requests.UpdateRecurrenceTemplateRequest;
import com.functions.events.models.responses.UpdateRecurrenceTemplateResponse;
import com.functions.events.services.RecurringEventsService;
import com.functions.utils.JavaUtils;
import com.google.cloud.functions.HttpFunction;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;

public class UpdateRecurrenceTemplateEndpoint implements HttpFunction {
    private static final Logger logger = LoggerFactory.getLogger(UpdateRecurrenceTemplateEndpoint.class);

    @Override
    public void service(HttpRequest request, HttpResponse response) throws Exception {
        response.appendHeader("Access-Control-Allow-Origin", "https://www.sportshub.net.au");
        response.appendHeader("Access-Control-Allow-Origin", "*");
        response.appendHeader("Access-Control-Allow-Methods", "GET");
        response.appendHeader("Access-Control-Allow-Headers", "Content-Type");

        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            response.setStatusCode(405); // Method Not Allowed
            response.appendHeader("Allow", "POST"); // Inform client that only GET is allowed
            response.getWriter().write("This function only supports GET requests.");
            return;
        }

        UpdateRecurrenceTemplateRequest data;
        try {
            data = JavaUtils.objectMapper.readValue(request.getReader(), UpdateRecurrenceTemplateRequest.class);
        } catch (Exception e) {
            response.setStatusCode(400);
            response.getWriter().write("Invalid request data: " + e);
            return;
        }

        Optional<String> maybeRecurrenceTemplateId = RecurringEventsService.updateRecurrenceTemplate(data.getRecurrenceTemplateId(), data.getEventData(), data.getRecurrenceData());

        if (maybeRecurrenceTemplateId.isPresent()) {
            response.setStatusCode(200);
            response.getWriter().write(
                    JavaUtils.objectMapper.writeValueAsString(
                            new UpdateRecurrenceTemplateResponse(maybeRecurrenceTemplateId.get())
                    )
            );
        } else {
            response.setStatusCode(500);
            response.getWriter().write(
                    JavaUtils.objectMapper.writeValueAsString(
                            new UpdateRecurrenceTemplateResponse("")
                    )
            );
        }
    }
}
