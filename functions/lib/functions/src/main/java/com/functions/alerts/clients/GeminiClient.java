package com.functions.alerts.clients;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.functions.global.handlers.Global;
import com.functions.utils.JavaUtils;
import com.google.auth.oauth2.GoogleCredentials;

public class GeminiClient implements LlmClient {
    private static final Logger logger = LoggerFactory.getLogger(GeminiClient.class);
    private static final String MODEL = "gemini-2.0-flash";
    private static final String LOCATION = "us-central1";
    private static final String CLOUD_PLATFORM_SCOPE = "https://www.googleapis.com/auth/cloud-platform";

    @Override
    public Optional<String> summarize(String prompt) {
        String projectId = Global.getEnv("PROJECT_NAME");
        if (projectId == null || projectId.isBlank()) {
            logger.warn("Cannot call Gemini: PROJECT_NAME is not set");
            return Optional.empty();
        }

        try {
            String token = accessToken();
            String url = String.format(
                    "https://%s-aiplatform.googleapis.com/v1/projects/%s/locations/%s/publishers/google/models/%s:generateContent",
                    LOCATION, projectId, LOCATION, MODEL);

            ObjectNode body = JavaUtils.objectMapper.createObjectNode();
            ArrayNode contents = body.putArray("contents");
            ObjectNode content = contents.addObject();
            content.put("role", "user");
            content.putArray("parts").addObject().put("text", prompt);
            ObjectNode generationConfig = body.putObject("generationConfig");
            generationConfig.put("temperature", 0.2);
            generationConfig.put("maxOutputTokens", 160);

            try (CloseableHttpClient client = HttpClients.createDefault()) {
                HttpPost post = new HttpPost(url);
                post.setHeader("Authorization", "Bearer " + token);
                post.setHeader("Content-Type", "application/json");
                post.setEntity(new StringEntity(JavaUtils.objectMapper.writeValueAsString(body),
                        StandardCharsets.UTF_8));
                try (CloseableHttpResponse response = client.execute(post)) {
                    String responseBody = EntityUtils.toString(response.getEntity(), StandardCharsets.UTF_8);
                    int status = response.getStatusLine().getStatusCode();
                    if (status < 200 || status >= 300) {
                        logger.warn("Gemini summarize failed: status={} body={}", status,
                                trimForLog(responseBody));
                        return Optional.empty();
                    }
                    return parseText(responseBody);
                }
            }
        } catch (Exception e) {
            logger.warn("Gemini summarize failed: {}", e.getMessage());
            return Optional.empty();
        }
    }

    static Optional<String> parseText(String responseBody) throws IOException {
        JsonNode root = JavaUtils.objectMapper.readTree(responseBody);
        JsonNode textNode = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
        if (!textNode.isTextual() || textNode.asText().isBlank()) {
            return Optional.empty();
        }
        return Optional.of(textNode.asText().trim());
    }

    private static String accessToken() throws IOException {
        GoogleCredentials credentials = GoogleCredentials.getApplicationDefault()
                .createScoped(CLOUD_PLATFORM_SCOPE);
        credentials.refreshIfExpired();
        if (credentials.getAccessToken() == null || credentials.getAccessToken().getTokenValue() == null) {
            throw new IOException("No access token available for Vertex AI");
        }
        return credentials.getAccessToken().getTokenValue();
    }

    private static String trimForLog(String body) {
        if (body == null) {
            return "";
        }
        return body.length() <= 300 ? body : body.substring(0, 300);
    }
}
