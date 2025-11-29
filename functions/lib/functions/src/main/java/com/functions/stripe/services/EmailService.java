package com.functions.stripe.services;

import java.io.IOException;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.firebase.services.FirebaseService;
import com.functions.global.handlers.Global;
import com.functions.utils.JavaUtils;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;

import lombok.Builder;
import lombok.Data;

/**
 * Service for sending emails related to event purchases.
 * Replaces the previous Python email service implementation with a direct Java implementation.
 */
public class EmailService {
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    
    private static final String LOOPS_API_KEY = Global.getEnv("LOOPS_API_KEY");
    private static final String LOOPS_TRANSACTIONAL_URL = "https://app.loops.so/api/v1/transactional";
    private static final String LOOPS_TRANSACTIONAL_ID = "cm4r78nk301ehx79nrrxaijgl";
    private static final ZoneId SYDNEY_TIMEZONE = ZoneId.of("Australia/Sydney");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MM/dd/yyyy, HH:mm");

    @Data
    @Builder
    private static class LoopsRequest {
        private String transactionalId;
        private String email;
        private Map<String, String> dataVariables;
    }

    /**
     * Sends a purchase confirmation email.
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
     */
    private static boolean sendPurchaseEmailWithRetries(String eventId, String visibility, String email, 
                                                        String firstName, String orderId, int maxRetries) {
        for (int attempt = 0; attempt < maxRetries; attempt++) {
            try {
                if (sendPurchaseEmailInternal(eventId, visibility, email, firstName, orderId)) {
                    logger.info("Successfully sent purchase email for order {} to {} (attempt {}/{})", 
                               orderId, email, attempt + 1, maxRetries);
                    return true;
                }
            } catch (Exception e) {
                logger.error("Failed to send purchase email for order {} to {} (attempt {}/{}): {}", 
                           orderId, email, attempt + 1, maxRetries, e.getMessage(), e);
            }
            
            if (attempt < maxRetries - 1) {
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }
        
        logger.warn("Failed to send purchase email after {} attempts for order {} to {}", 
                    maxRetries, orderId, email);
        return false;
    }
    
    /**
     * Internal implementation of sending purchase email.
     */
    private static boolean sendPurchaseEmailInternal(String eventId, String visibility, String email, 
                                                    String firstName, String orderId) throws ExecutionException, InterruptedException, IOException {
        Firestore db = FirebaseService.getFirestore();
        
        // Fetch Data
        DocumentSnapshot eventSnapshot = fetchDocument(db, "Events", "Active", visibility, eventId);
        if (!eventSnapshot.exists()) {
            logger.error("Unable to find event provided in datastore to send email. eventId={}", eventId);
            return false;
        }
        
        DocumentSnapshot orderSnapshot = fetchDocument(db, "Orders", orderId);
        if (!orderSnapshot.exists()) {
            logger.error("Unable to find orderId provided in datastore to send email. orderId={}", orderId);
            return false;
        }
        
        // Prepare Variables
        Map<String, String> variables = buildEmailVariables(eventSnapshot, orderSnapshot, firstName, orderId);
        
        // Send email to attendee
        sendEmailWithLoop(email, variables);
                          
        // Check and send email to organiser
        String organiserId = eventSnapshot.getString("organiserId");
        if (organiserId != null) {
            Optional<String> organiserEmail = getOrganiserEmailForTicketEmail(db, organiserId);
            organiserEmail.ifPresent(orgEmail -> {
                try {
                    sendEmailWithLoop(orgEmail, variables);
                } catch (IOException e) {
                    logger.error("Failed to send copy of purchase email to organiser {}: {}", organiserId, e.getMessage());
                }
            });
        }
        
        return true;
    }
    
    private static DocumentSnapshot fetchDocument(Firestore db, String... pathSegments) throws ExecutionException, InterruptedException {
        if (pathSegments.length == 2) {
             return db.collection(pathSegments[0]).document(pathSegments[1]).get().get();
        } else if (pathSegments.length == 4) {
             return db.collection(pathSegments[0]).document(pathSegments[1])
                      .collection(pathSegments[2]).document(pathSegments[3]).get().get();
        }
        throw new IllegalArgumentException("Unsupported path segments length");
    }
    
    private static Map<String, String> buildEmailVariables(DocumentSnapshot event, DocumentSnapshot order, String firstName, String orderId) {
        Timestamp startTimestamp = event.get("startDate", Timestamp.class);
        Timestamp endTimestamp = event.get("endDate", Timestamp.class);
        Timestamp purchasedTimestamp = order.get("datePurchased", Timestamp.class);
        
        Double price = event.getDouble("price");
        if (price == null) {
             Long priceLong = event.getLong("price");
             price = priceLong != null ? priceLong.doubleValue() : 0.0;
        }
        
        List<?> tickets = (List<?>) order.get("tickets");
        String quantity = tickets != null ? String.valueOf(tickets.size()) : "0";

        return Map.of(
            "name", Optional.ofNullable(firstName).orElse(""),
            "eventName", Optional.ofNullable(event.getString("name")).orElse(""),
            "orderId", Optional.ofNullable(orderId).orElse(""),
            "datePurchased", formatTimestamp(purchasedTimestamp),
            "quantity", quantity,
            "price", centsToDollars(price),
            "startDate", formatTimestamp(startTimestamp),
            "endDate", formatTimestamp(endTimestamp),
            "location", Optional.ofNullable(event.getString("location")).orElse("")
        );
    }

    private static String formatTimestamp(Timestamp timestamp) {
        if (timestamp == null) return "";
        ZonedDateTime zdt = ZonedDateTime.ofInstant(Instant.ofEpochSecond(timestamp.getSeconds(), timestamp.getNanos()), SYDNEY_TIMEZONE);
        return zdt.format(DATE_FORMATTER);
    }
    
    private static String centsToDollars(Double priceInCents) {
        if (priceInCents == null) return "$0.00";
        return String.format("$%.2f", priceInCents / 100.0);
    }
    
    private static Optional<String> getOrganiserEmailForTicketEmail(Firestore db, String organiserId) throws ExecutionException, InterruptedException {
        DocumentSnapshot organiserSnapshot = fetchDocument(db, "Users", "Active", "Private", organiserId);
                                               
        if (!organiserSnapshot.exists()) {
            logger.error("Organiser does not exist: organiserId={}", organiserId);
            return Optional.empty();
        }
        
        if (Boolean.TRUE.equals(organiserSnapshot.getBoolean("sendOrganiserTicketEmails"))) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> contactInfo = (Map<String, Object>) organiserSnapshot.get("contactInformation");
                if (contactInfo != null && contactInfo.get("email") instanceof String) {
                    return Optional.of((String) contactInfo.get("email"));
                }
            } catch (Exception e) {
                logger.error("Failed to find organiser email for sendOrganiserTicketEmail. organiserId={}", organiserId);
                throw new RuntimeException("Failed to find organiser email for sendOrganiserTicketEmail. organiserId=" + organiserId, e);
            }
        }
        
        return Optional.empty();
    }
    
    private static void sendEmailWithLoop(String email, Map<String, String> variables) throws IOException {
        if (LOOPS_API_KEY == null) {
            throw new IOException("LOOPS_API_KEY is not set.");
        }

        LoopsRequest request = LoopsRequest.builder()
                .transactionalId(LOOPS_TRANSACTIONAL_ID)
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
                logger.error("Failed to send payment confirmation via Loops. Status: {}, Body: {}", statusCode, responseBody);
                throw new IOException("Failed to send payment confirmation via Loops. Status: " + statusCode);
            }
        }
    }
}
