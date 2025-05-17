package com.functions.comments.controllers;

import com.functions.comments.models.UserComment;
import com.functions.comments.models.requests.CreateUserCommentRequest;
import com.functions.comments.services.CommentsService;
import com.functions.utils.JavaUtils;
import com.google.cloud.functions.HttpFunction;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class CreateUserCommentEndpoint implements HttpFunction {
    private static final Logger logger = LoggerFactory.getLogger(CreateUserCommentEndpoint.class);

    @Override
    public void service(HttpRequest request, HttpResponse response) throws Exception {
        // Set CORS headers
        response.appendHeader("Access-Control-Allow-Origin", "*");
        response.appendHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        response.appendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        response.appendHeader("Access-Control-Max-Age", "3600");

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatusCode(204);
            return;
        }

        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            response.setStatusCode(405);
            response.appendHeader("Allow", "POST");
            response.getWriter().write("Only POST method is allowed.");
            return;
        }

        // Parse request body
        CreateUserCommentRequest commentRequest;
        try {
            commentRequest = JavaUtils.objectMapper.readValue(request.getReader(), CreateUserCommentRequest.class);
        } catch (Exception e) {
            logger.error("Failed to parse request body", e);
            response.setStatusCode(400);
            response.getWriter().write("Invalid request body.");
            return;
        }

        UserComment comment = commentRequest.comment();
        if (commentRequest.targetUserId() == null || commentRequest.targetUserId().isBlank() ||
            comment == null || comment.getComment() == null || comment.getComment().isBlank()) {
            response.setStatusCode(400);
            response.getWriter().write("Missing required fields: targetUserId or comment.");
            return;
        }

        // Default to "anonymous" if authorId is missing
        if (comment.getAuthorId() == null || comment.getAuthorId().isBlank()) {
            comment.setAuthorId("anonymous");
        }

        // Add timestamp
        comment.setTimestamp(System.currentTimeMillis());

        try {
            CommentsService.createCommentForUser(commentRequest.targetUserId(), comment);
            response.setStatusCode(200);
            response.getWriter().write("Comment added successfully.");
        } catch (Exception e) {
            logger.error("Failed to add comment", e);
            response.setStatusCode(500);
            response.getWriter().write("Error adding comment: " + e.getMessage());
        }
    }
}
