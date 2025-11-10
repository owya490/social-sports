package com.functions.stripe.services;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.firebase.models.requests.CallFirebaseFunctionRequest;
import com.functions.global.handlers.Global;
import com.functions.utils.JavaUtils;

/**
 * Service for sending emails related to event purchases.
 * Currently delegates to the Python email service.
 */
public class EmailService {
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    
    private static final String PROD_URL = "https://australia-southeast1-socialsportsprod.cloudfunctions.net";
    private static final String DEV_URL = "https://australia-southeast1-socialsports-44162.cloudfunctions.net";
    
    /**
     * Sends a purchase confirmation email by calling the Python email service.
     * 
     * @param eventId The event ID
     * @param visibility Either "Private" or "Public"
     * @param email The recipient email
     * @param firstName The purchaser's first name
     * @param orderId The order ID
     * @return true if email was sent successfully, false otherwise
     */
    public static boolean sendPurchaseEmail(String eventId, String visibility, String email, String firstName, String orderId) {
        return sendPurchaseEmailWithRetries(eventId, visibility, email, firstName, orderId, 3);
    }
    
    /**
     * Sends a purchase confirmation email with retry logic.
     * 
     * @param eventId The event ID
     * @param visibility Either "Private" or "Public"
     * @param email The recipient email
     * @param firstName The purchaser's first name
     * @param orderId The order ID
     * @param maxRetries Maximum number of retry attempts
     * @return true if email was sent successfully, false otherwise
     */
    private static boolean sendPurchaseEmailWithRetries(String eventId, String visibility, String email, 
                                                        String firstName, String orderId, int maxRetries) {
        for (int attempt = 0; attempt < maxRetries; attempt++) {
            try {
                boolean success = sendPurchaseEmailRequest(eventId, visibility, email, firstName, orderId);
                if (success) {
                    logger.info("Successfully sent purchase email for order {} to {} (attempt {}/{})", 
                               orderId, email, attempt + 1, maxRetries);
                    return true;
                }
            } catch (Exception e) {
                logger.error("Failed to send purchase email for order {} to {} (attempt {}/{}): {}", 
                           orderId, email, attempt + 1, maxRetries, e.getMessage(), e);
            }
        }
        
        logger.warn("Failed to send purchase email after {} attempts for order {} to {}", 
                    maxRetries, orderId, email);
        return false;
    }
    
    /**
     * Makes a single attempt to send a purchase email via the Python email service.
     * 
     * @param eventId The event ID
     * @param visibility Either "Private" or "Public"
     * @param email The recipient email
     * @param firstName The purchaser's first name
     * @param orderId The order ID
     * @return true if email was sent successfully, false otherwise
     * @throws IOException if there's a network error
     */
    private static boolean sendPurchaseEmailRequest(String eventId, String visibility, String email, 
                                                    String firstName, String orderId) throws IOException {
        String projectName = Global.getEnv("PROJECT_NAME");
        boolean isProd = "socialsportsprod".equals(projectName);
        String baseUrl = isProd ? PROD_URL : DEV_URL;
        String url = baseUrl + "/send_email_on_purchase_event";
        
        Map<String, Object> requestData = new HashMap<>();
        requestData.put("eventId", eventId);
        requestData.put("visibility", visibility);
        requestData.put("email", email);
        requestData.put("first_name", firstName);
        requestData.put("orderId", orderId);
        
        CallFirebaseFunctionRequest request = new CallFirebaseFunctionRequest(requestData);
        
        try (CloseableHttpClient client = HttpClients.createDefault()) {
            HttpPost post = new HttpPost(url);
            post.setHeader("Content-Type", "application/json");
            post.setHeader("Accept", "application/json");
            
            String jsonData = JavaUtils.objectMapper.writeValueAsString(request);
            post.setEntity(new StringEntity(jsonData));
            
            try (CloseableHttpResponse response = client.execute(post)) {
                int statusCode = response.getStatusLine().getStatusCode();
                String responseBody = EntityUtils.toString(response.getEntity());
                
                if (statusCode >= 200 && statusCode < 300) {
                    logger.info("Purchase email sent successfully for order {}", orderId);
                    return true;
                } else {
                    logger.error("Email service returned error status {} for order {}: {}", 
                               statusCode, orderId, responseBody);
                    return false;
                }
            }
        }
    }
}

