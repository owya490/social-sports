package com.functions.waitlist.controllers;

import com.functions.global.controllers.AbstractConfiguredHttpFunction;
import com.functions.waitlist.services.WaitlistService;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;

public class WaitlistNotificationCronEndpoint extends AbstractConfiguredHttpFunction {
    @Override
    public void service(HttpRequest request, HttpResponse response) throws Exception {
        response.appendHeader("Access-Control-Allow-Origin", "*");
        response.appendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        response.appendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        response.appendHeader("Access-Control-Max-Age", "3600");

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatusCode(204);
            return;
        }

        if (!(request.getMethod().equalsIgnoreCase("GET"))) {
            response.setStatusCode(405);
            response.appendHeader("Allow", "GET");
            response.getWriter().write("The WaitlistNotificationCronEndpoint only supports GET requests.");
            return;
        }

        int notifiedCount = WaitlistService.processWaitlistNotificationsForAllEvents();
        response.setStatusCode(200);
        response.getWriter().write("Waitlist notification run complete. Notifications sent: " + notifiedCount);
    }
}
