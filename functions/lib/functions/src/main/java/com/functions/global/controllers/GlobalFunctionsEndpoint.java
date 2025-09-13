package com.functions.global.controllers;

import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.functions.events.models.NewEventData;
import com.functions.events.services.EventsService;
import com.functions.firebase.services.FirebaseService;
import com.functions.forms.models.requests.SaveTempFormResponseRequest;
import com.functions.forms.models.responses.SaveTempFormResponseResponse;
import com.functions.forms.services.FormsService;
import com.functions.global.models.EndpointType;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.global.models.responses.ErrorResponse;
import com.functions.global.models.responses.UnifiedResponse;
import com.functions.utils.JavaUtils;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.functions.HttpFunction;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;

/**
 * Unified endpoint that routes requests to specific handlers based on the endpoint type.
 * 
 * This provides a single entry point for all function calls while maintaining type safety.
 */
public class GlobalFunctionsEndpoint implements HttpFunction {
    private static final Logger logger = LoggerFactory.getLogger(GlobalFunctionsEndpoint.class);

    @Override
    public void service(HttpRequest request, HttpResponse response) throws Exception {
        setResponseHeaders(response);

        // Handle preflight (OPTIONS) requests
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatusCode(204); // No Content
            return;
        }

        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            response.setStatusCode(405); // Method Not Allowed
            response.appendHeader("Allow", "POST");
            response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                    new ErrorResponse("The GlobalFunctionsEndpoint only supports POST requests.")));
            return;
        }

        try {
            UnifiedRequest unifiedRequest;
            try {
                unifiedRequest =
                        JavaUtils.objectMapper.readValue(request.getReader(), UnifiedRequest.class);
            } catch (Exception e) {
                response.setStatusCode(400); // Bad Request
                logger.error("Could not parse request input:", e);
                response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                        new ErrorResponse("Invalid request data: " + e.getMessage())));
                return;
            }

            if (unifiedRequest.endpointType() == null || unifiedRequest.data() == null) {
                response.setStatusCode(400);
                response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                        new ErrorResponse("Both endpointType and data are required.")));
                return;
            }

            Object result = routeRequest(unifiedRequest);

            response.setStatusCode(200);
            response.getWriter().write(
                    JavaUtils.objectMapper.writeValueAsString(UnifiedResponse.success(result)));

        } catch (Exception e) {
            logger.error("Error processing request", e);
            response.setStatusCode(500);
            response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(
                    new ErrorResponse("Internal server error: " + e.getMessage())));
        }
    }

    private Object routeRequest(UnifiedRequest unifiedRequest) throws Exception {
        EndpointType endpointType = unifiedRequest.endpointType();

        return switch (endpointType) {
            case SAVE_TEMP_FORM_RESPONSE -> handleSaveTempFormResponse(unifiedRequest);
            case CREATE_EVENT -> handleCreateEvent(unifiedRequest);
        };
    }

    private SaveTempFormResponseResponse handleSaveTempFormResponse(UnifiedRequest unifiedRequest)
            throws Exception {
        SaveTempFormResponseRequest request = JavaUtils.objectMapper
                .treeToValue(unifiedRequest.data(), SaveTempFormResponseRequest.class);
        if (request == null || request.formResponse() == null) {
            throw new IllegalArgumentException("formResponse is required");
        }

        Optional<String> maybeFormResponseId =
                FormsService.saveTempFormResponse(request.formResponse());

        if (maybeFormResponseId.isPresent()) {
            String formResponseId = maybeFormResponseId.get();
            logger.info(
                    "[GlobalFunctionsEndpoint] Temporary form response saved successfully with ID: {}",
                    formResponseId);
            return new SaveTempFormResponseResponse(formResponseId);
        } else {
            logger.error("Failed to save temporary form response for formId: {}, eventId: {}",
                    request.formResponse().getFormId(), request.formResponse().getEventId());
            throw new RuntimeException("Failed to save temporary form response");
        }
    }

    private String handleCreateEvent(UnifiedRequest unifiedRequest) throws Exception {
        NewEventData request =
                JavaUtils.objectMapper.treeToValue(unifiedRequest.data(), NewEventData.class);

        Firestore db = FirebaseService.getFirestore();
        String eventId =
                db.runTransaction(transaction -> EventsService.createEvent(request, transaction))
                        .get();

        logger.info("[GlobalFunctionsEndpoint] Event created successfully with ID: {}", eventId);
        return "Event created successfully with ID: " + eventId;
    }

    private void setResponseHeaders(HttpResponse response) {
        response.appendHeader("Access-Control-Allow-Origin", "*");
        response.appendHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        response.appendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        response.appendHeader("Access-Control-Max-Age", "3600"); // Cache preflight for 1 hour
        response.appendHeader("Content-Type", "application/json; charset=UTF-8");
    }
}
