package com.functions.emails;

import java.io.IOException;
import java.util.Map;

import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.emails.requests.LoopsRequest;
import com.functions.global.handlers.Global;
import com.functions.utils.JavaUtils;

/**
 * Service for sending emails via Loops.so.
 */
public class EmailClient {
    private static final Logger logger = LoggerFactory.getLogger(EmailClient.class);
    
    private static final String LOOPS_API_KEY = Global.getEnv("LOOPS_API_KEY");
    private static final String LOOPS_TRANSACTIONAL_URL = "https://app.loops.so/api/v1/transactional";  

    private static final int MAX_RETRIES = 3;

    /**
     * Sends an email with retry logic (recommended for production use).
     * 
     * @param templateType   The email template type enum
     * @param email          The recipient email address
     * @param variables      The email template variables
     * @return true if email was sent successfully, false otherwise
     */
    public static boolean sendEmailWithLoopsWithRetries(EmailTemplateType templateType, String email, 
                                                       Map<String, String> variables) {
        return sendEmailWithLoopsWithRetries(templateType.templateId, email, variables);
    }

    /**
     * Sends an email with retry logic (recommended for production use).
     * 
     * @param transactionalId The Loops transactional email ID
     * @param email          The recipient email address
     * @param variables      The email template variables
     * @return true if email was sent successfully, false otherwise
     */
    public static boolean sendEmailWithLoopsWithRetries(String transactionalId, String email, 
                                                       Map<String, String> variables) {
        for (int attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                int statusCode = sendEmailWithLoops(transactionalId, email, variables);
                if (statusCode >= 200 && statusCode < 300) {
                    // if success, return true and don't retry
                    logger.info("Successfully sent email to {} (attempt {}) with status {}", email, attempt + 1, statusCode);
                    return true;
                } else {
                    logger.error("Failed to send email to {} (attempt {}): Status {}", 
                           email, attempt + 1, statusCode);
                }
            } catch (Exception e) {
                logger.error("Failed to send email to {} (attempt {}/{}): {}", 
                           email, attempt + 1, MAX_RETRIES, e.getMessage(), e);
            }

            // Exponential backoff
            if (attempt < MAX_RETRIES - 1) {
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

        logger.error("Failed to send email after {} attempts to {}", MAX_RETRIES, email);
        return false;
    }

    /**
     * Sends an email without retry logic (single attempt).
     * 
     * @param transactionalId The Loops transactional email ID
     * @param email          The recipient email address
     * @param variables      The email template variables
     * @throws IOException if the email fails to send
     */
    private static int sendEmailWithLoops(String transactionalId, String email, 
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
            return sendLoopsRequest(client, jsonBody);
        }
    }
    
    private static int sendLoopsRequest(CloseableHttpClient client, String jsonBody) throws IOException {
        HttpPost post = new HttpPost(LOOPS_TRANSACTIONAL_URL);
        post.setHeader("Authorization", "Bearer " + LOOPS_API_KEY);
        post.setHeader("Content-Type", "application/json");
        post.setEntity(new StringEntity(jsonBody));

        
        try (CloseableHttpResponse response = client.execute(post)) {
            return response.getStatusLine().getStatusCode();
        } catch (IOException e) {
            logger.error("Failed to send Loops request. Exception: {}", e.getMessage());
            throw e;
        }
    }
}