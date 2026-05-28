package com.functions.smoke.controllers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.global.controllers.AbstractConfiguredHttpFunction;
import com.functions.global.handlers.Global;
import com.functions.smoke.models.SmokeRunResponse;
import com.functions.smoke.services.SmokeE2eService;
import com.functions.utils.JavaUtils;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;

public class SmokeE2eEndpoint extends AbstractConfiguredHttpFunction {
    private static final Logger logger = LoggerFactory.getLogger(SmokeE2eEndpoint.class);

    @Override
    public void service(HttpRequest request, HttpResponse response) throws Exception {
        response.appendHeader("Access-Control-Allow-Origin", "*");
        response.appendHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        response.appendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        response.appendHeader("Access-Control-Max-Age", "3600");
        response.appendHeader("Content-Type", "application/json; charset=UTF-8");

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatusCode(204);
            return;
        }

        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            response.setStatusCode(405);
            response.appendHeader("Allow", "POST");
            response.getWriter().write("{\"error\":\"Only POST is supported.\"}");
            return;
        }

        if (!isAuthorized(request)) {
            response.setStatusCode(401);
            response.getWriter().write("{\"error\":\"Unauthorized\"}");
            return;
        }

        SmokeRunResponse runResponse = new SmokeE2eService().run();
        String logPayload = JavaUtils.objectMapper.writeValueAsString(runResponse.toLogMap());

        if ("PASSED".equals(runResponse.status) && "SUCCESS".equals(runResponse.cleanupStatus)) {
            logger.info("smoke_e2e_run {}", logPayload);
            response.setStatusCode(200);
        } else {
            logger.error("smoke_e2e_run {}", logPayload);
            response.setStatusCode(500);
        }

        response.getWriter().write(JavaUtils.objectMapper.writeValueAsString(runResponse));
    }

    private static boolean isAuthorized(HttpRequest request) {
        String expectedToken = Global.getEnv("SMOKE_AUTH_TOKEN");
        if (expectedToken == null || expectedToken.isBlank()) {
            // Backward compatible fallback to existing bearer token env.
            expectedToken = Global.getEnv("BEARER_TOKEN");
        }
        if (expectedToken == null || expectedToken.isBlank()) {
            return false;
        }

        String authHeader = request.getFirstHeader("Authorization").orElse("");
        String expectedHeader = "Bearer " + expectedToken.trim();
        return expectedHeader.equals(authHeader.trim());
    }
}
