package com.functions.comments.controllers;

import com.functions.comments.models.UserComment;
import com.functions.comments.models.requests.CreateUserCommentRequest;
import com.functions.comments.services.CommentsService;
import com.functions.utils.JavaUtils;
import com.google.cloud.functions.HttpFunction;
import com.google.cloud.functions.HttpRequest;
import com.google.cloud.functions.HttpResponse;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseToken;

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

        // Preflight support
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            logger.info("Handling OPTIONS request for comment creation.");
            response.setStatusCode(204);
            return;
        }

        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            logger.warn("Invalid method: {}", request.getMethod());
            response.setStatusCode(405);
            response.appendHeader("Allow", "POST");
            response.getWriter().write("Only POST method is allowed.");
            return;
        }

        String authHeader = request.getHeaders().get("Authorization") != null
                ? request.getHeaders().get("Authorization").get(0)
                : null;
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            response.setStatusCode(401);
            response.getWriter().write("Missing or invalid Authorization header.");
            return;
        }

        String idToken = authHeader.substring(7); // Remove "Bearer " prefix
        FirebaseToken decodedToken;
        try {
            decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
        } catch (Exception e) {
            logger.error("Failed to verify Firebase ID token", e);
            response.setStatusCode(401);
            response.getWriter().write("Unauthorized: Invalid token.");
            return;
        }

        String commenterUserId = decodedToken.getUid();

        // Parse request body
        CreateUserCommentRequest commentRequest;
        try {
            commentRequest = JavaUtils.objectMapper.readValue(request.getReader(), CreateUserCommentRequest.class);
        } catch (Exception e) {
            logger.error("Failed to parse comment request body", e);
            response.setStatusCode(400);
            response.getWriter().write("Invalid request body.");
            return;
        }

        if (commentRequest.targetUserId() == null || commentRequest.targetUserId().isBlank() ||
                commentRequest.comment() == null || commentRequest.comment().getComment() == null
                || commentRequest.comment().getComment().isBlank()) {
            response.setStatusCode(400);
            response.getWriter().write("Missing required fields: targetUserId or comment.");
            return;
        }

        // Override authorId and timestamp
        UserComment comment = commentRequest.comment();
        comment.setAuthorId(commenterUserId);
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
