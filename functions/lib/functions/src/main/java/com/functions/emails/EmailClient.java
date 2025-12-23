package com.functions.emails;

import java.io.IOException;
import java.util.Map;

import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.global.handlers.Global;
import com.functions.utils.JavaUtils;

import lombok.Builder;
import lombok.Data;

/**
 * Service for sending emails via Loops.so.
 */
public class EmailClient {
    private static final Logger logger = LoggerFactory.getLogger(EmailClient.class);
    
    private static final String LOOPS_API_KEY = Global.getEnv("LOOPS_API_KEY");
    private static final String LOOPS_TRANSACTIONAL_URL = "https://app.loops.so/api/v1/transactional";
    
    // Transactional IDs for different email types
    public static final String PURCHASE_EMAIL_ID = "cm4r78nk301ehx79nrrxaijgl";
    public static final String WAITLIST_CONFIRMATION_EMAIL_ID = "cmjcdaf0h05gt0i56iicea2ys";
    public static final String WAITLIST_NOTIFICATION_EMAIL_ID = "cmjgp5at54ceh0iyg06ddxftt";


    @Data
    @Builder
    private static class LoopsRequest {
        private String transactionalId;
        private String email;
        private Map<String, String> dataVariables;
    }

    /**
     * Sends an email with retry logic (recommended for production use).
     * 
     * @param transactionalId The Loops transactional email ID
     * @param email          The recipient email address
     * @param variables      The email template variables
     * @param maxRetries     Maximum number of retry attempts
     * @return true if email was sent successfully, false otherwise
     */
    public static boolean sendEmailWithLoopWithRetries(String transactionalId, String email, 
                                                       Map<String, String> variables, int maxRetries) {
        for (int attempt = 0; attempt < maxRetries; attempt++) {
            try {
                sendEmailWithLoop(transactionalId, email, variables);
                logger.info("Successfully sent email to {} (attempt {}/{})", email, attempt + 1, maxRetries);
                return true;
            } catch (Exception e) {
                logger.error("Failed to send email to {} (attempt {}/{}): {}", 
                           email, attempt + 1, maxRetries, e.getMessage(), e);
            }

            // Exponential backoff: 1s, 2s, 4s, 8s...
            if (attempt < maxRetries - 1) {
                try {
                    long delay = (long) Math.pow(2, attempt) * 1000;
                    logger.info("Retrying email send to {} after {}ms delay", email, delay);
                    Thread.sleep(delay);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    logger.error("Interrupted while waiting to retry email send");
                    break;
                }
            }
        }

        logger.warn("Failed to send email after {} attempts to {}", maxRetries, email);
        return false;
    }

    /**
     * Sends an email without retry logic (single attempt).
     * For production use, prefer sendEmailWithLoopWithRetries().
     * 
     * @param transactionalId The Loops transactional email ID
     * @param email          The recipient email address
     * @param variables      The email template variables
     * @throws IOException if the email fails to send
     */
    public static void sendEmailWithLoop(String transactionalId, String email, 
                                         Map<String, String> variables) throws IOException {
        if (LOOPS_API_KEY == null) {
            throw new IOException("LOOPS_API_KEY is not set.");
        }

        LoopsRequest request = LoopsRequest.builder()
                .transactionalId(transactionalId)
                .email(email)
                .dataVariables(variables)
                .build();
        
        String jsonBody = JavaUtils.objectMapper.writeValueAsString(request);
        
        try (CloseableHttpClient client = HttpClients.createDefault()) {
            sendLoopRequest(client, jsonBody, false);
        }
    }
    
    private static void sendLoopRequest(CloseableHttpClient client, String jsonBody, boolean isRetry) throws IOException {
        HttpPost post = new HttpPost(LOOPS_TRANSACTIONAL_URL);
        post.setHeader("Authorization", "Bearer " + LOOPS_API_KEY);
        post.setHeader("Content-Type", "application/json");
        post.setEntity(new StringEntity(jsonBody));
        
        try (CloseableHttpResponse response = client.execute(post)) {
            int statusCode = response.getStatusLine().getStatusCode();
            
            if (statusCode == 429 && !isRetry) {
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    throw new IOException("Interrupted while waiting to retry Loops API", e);
                }
                sendLoopRequest(client, jsonBody, true);
                return;
            }
            
            if (statusCode < 200 || statusCode >= 300) {
                String responseBody = EntityUtils.toString(response.getEntity());
                logger.error("Failed to send email via Loops. Status: {}, Body: {}", statusCode, responseBody);
                throw new IOException("Failed to send email via Loops. Status: " + statusCode);
            }
        }
    }
}