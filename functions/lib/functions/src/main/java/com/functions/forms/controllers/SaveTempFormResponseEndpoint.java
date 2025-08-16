package com.functions.forms.controllers;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.forms.models.requests.SaveTempFormResponseRequest;
import com.functions.forms.models.responses.SaveTempFormResponseResponse;
import com.functions.forms.services.FormsService;
import com.functions.global.models.responses.ErrorResponse;
import com.functions.utils.JavaUtils;
import com.google.cloud.functions.HttpFunction;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;

public class SaveTempFormResponseEndpoint implements HttpFunction {
    private static final Logger logger = LoggerFactory.getLogger(SaveTempFormResponseEndpoint.class);

    @Override
    public void service(HttpRequest request, HttpResponse response) throws Exception {
        // Set CORS headers for all responses
        response.appendHeader("Access-Control-Allow-Origin", "*");
        response.appendHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        response.appendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        response.appendHeader("Access-Control-Max-Age", "3600"); // Cache preflight for 1 hour

        // Handle preflight (OPTIONS) requests
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatusCode(204); // No Content
            return;
        }

        if (!(request.getMethod().equalsIgnoreCase("POST"))) {
            response.setStatusCode(405); // Method Not Allowed
            response.appendHeader("Allow", "POST");
            response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                    new ErrorResponse("The SaveTempFormResponseEndpoint only supports POST requests.")));
            return;
        }

        SaveTempFormResponseRequest data;
        try {
            data = JavaUtils.objectMapper.readValue(request.getReader(), SaveTempFormResponseRequest.class);
        } catch (Exception e) {
            response.setStatusCode(400);
            logger.error("Could not parse input:", e);
            response.getWriter().write(JavaUtils.objectMapper
                    .writeValueAsString(new ErrorResponse("Invalid request data: " + e.getMessage())));
            return;
        }

        Optional<String> maybeFormResponseId = FormsService.saveTempFormResponse(data.formResponse());

        if (maybeFormResponseId.isPresent()) {
            String formResponseId = maybeFormResponseId.get();
            logger.info("[SaveTempFormResponseEndpoint] Temporary form response saved successfully with ID: {}",
                    formResponseId);
            response.setStatusCode(200);
            response.getWriter().write(
                    JavaUtils.objectMapper.writeValueAsString(
                            new SaveTempFormResponseResponse(formResponseId)));
        } else {
            logger.error("Failed to save temporary form response for formId: {}, eventId: {}",
                    data.formResponse().getFormId(), data.formResponse().getEventId());
            response.setStatusCode(500);
            response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                    new ErrorResponse("Failed to save temporary form response: ")));
        }
    }
}
