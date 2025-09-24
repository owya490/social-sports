package com.functions.firebase.services;

import static com.functions.utils.JavaUtils.objectMapper;

import java.io.FileInputStream;
import java.util.List;
import java.util.Optional;

import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.firebase.models.requests.CallFirebaseFunctionRequest;
import com.functions.firebase.models.responses.CallFirebaseFunctionResponse;
import com.functions.global.handlers.Global;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.logging.Logging;
import com.google.cloud.logging.LoggingOptions;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import com.posthog.java.PostHog;

import lombok.Getter;

public class FirebaseService {

    public static class CollectionPaths {
        public static final String EVENTS = "Events";
        public static final String ACTIVE = "Active";
        public static final String INACTIVE = "InActive";
        public static final String PRIVATE = "Private";
        public static final String PUBLIC = "Public";
        public static final String USERS = "Users";
        public static final String EVENTS_METADATA = "EventsMetadata";
        public static final String RECURRING_EVENTS = "RecurringEvents";
        public static final List<String> EVENT_PATHS = List.of(
                "Events/Active/Public",
                "Events/Active/Private",
                "Events/InActive/Public",
                "Events/InActive/Private");
        public static final String FULFILMENT_SESSIONS_ROOT_PATH = "FulfilmentSessions";
        public static final String TEMP_FORM_RESPONSE_PATH = "Forms/FormResponses/Temp";
        public static final String SUBMITTED_FORM_RESPONSE_PATH = "Forms/FormResponses/Submitted";
        public static final List<String> FORM_RESPONSE_PATHS = List.of(
                SUBMITTED_FORM_RESPONSE_PATH,
                TEMP_FORM_RESPONSE_PATH);
    }

    public static final String REGION = "australia-southeast1";

    private static final Logger logger = LoggerFactory.getLogger(FirebaseService.class);

    private static Firestore db;
    @Getter
    private static Logging logging;
    @Getter
    private static String posthogApiKey;
    private static String posthogHost;
    @Getter
    private static String firebaseProject;
    @Getter
    private static PostHog posthog;

    static {
        try {
            logger.info("Initializing FirebaseService...");
            if (FirebaseApp.getApps().isEmpty()) {
                logger.debug("No Firebase apps found, initializing...");
                initialize();
            } else {
                logger.debug("Firebase apps already exist: {}", FirebaseApp.getApps().size());
            }
        } catch (Exception e) {
            logger.error("Error initializing FirebaseService: {}", e.getMessage(), e);
        }
    }

    private static void initialize() throws Exception {
        logger.info("Starting Firebase initialization process");
        
        String credentialsPath = "functions_key.json";
        posthogApiKey = Global.getEnv("POSTHOG_API_KEY");
        posthogHost = "https://app.posthog.com";
        firebaseProject = Global.getEnv("PROJECT_NAME");

        logger.debug("Configuration: credentialsPath={}, posthogHost={}, firebaseProject={}, posthogApiKey={}",
                credentialsPath, posthogHost, firebaseProject, posthogApiKey != null ? "[PRESENT]" : "[MISSING]");

        if (firebaseProject == null) {
            logger.error("Firebase project name is not set in the environment variables.");
            throw new Exception("Firebase project name is not set in the environment variables.");
        }

        logger.debug("Loading Firebase credentials from: {}", credentialsPath);
        FileInputStream serviceAccount = new FileInputStream(credentialsPath);
        FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                .setProjectId(firebaseProject)
                .build();
                
        boolean hasBeenInitialised = false;
        List<FirebaseApp> firebaseApps = FirebaseApp.getApps();
        logger.debug("Checking existing Firebase apps: {}", firebaseApps.size());
        
        for (FirebaseApp app : firebaseApps) {
            logger.debug("Found Firebase app: {}", app.getName());
            if (app.getName().equals(FirebaseApp.DEFAULT_APP_NAME)) {
                hasBeenInitialised = true;
                logger.debug("Default Firebase app already initialized");
            }
        }
        
        if (!hasBeenInitialised) {
            logger.info("Initializing new Firebase app");
            FirebaseApp.initializeApp(options);
        } else {
            logger.debug("Firebase app already initialized, skipping");
        }

        if (FirebaseApp.getApps().isEmpty()) {
            logger.error("Firebase initialization failed - no apps available after initialization");
            throw new Exception("Firebase not initialized");
        }
        
        logger.debug("Initializing Firestore client");
        db = FirestoreClient.getFirestore();
        
        logger.debug("Initializing Cloud Logging client");
        logging = LoggingOptions.getDefaultInstance().getService();

        logger.debug("Initializing PostHog client");
        posthog = new PostHog.Builder(posthogApiKey).host(posthogHost).build();
        
        logger.info("Firebase initialization completed successfully");
    }

    public static Firestore getFirestore() {
        if (db == null) {
            logger.warn("Firestore client is null - Firebase may not be properly initialized");
        }
        return db;
    }

    public static Optional<CallFirebaseFunctionResponse> callFirebaseFunction(String functionName, Object requestData) {
        logger.info("Calling Firebase function: {}", functionName);
        logger.debug("Request data type: {}", requestData != null ? requestData.getClass().getSimpleName() : "null");
        
        try (CloseableHttpClient client = HttpClients.createDefault()) {
            String functionUrl = String.format("https://%s-%s.cloudfunctions.net/%s", REGION,
                    System.getenv("PROJECT_NAME"), functionName);
            
            logger.debug("Function URL: {}", functionUrl);

            HttpPost post = new HttpPost(functionUrl);
            post.setHeader("Content-Type", "application/json");

            String jsonData = objectMapper.writeValueAsString(new CallFirebaseFunctionRequest(requestData));
            logger.debug("Request payload size: {} characters", jsonData.length());
            post.setEntity(new StringEntity(jsonData));

            logger.debug("Executing HTTP request to Firebase function");
            try (CloseableHttpResponse response = client.execute(post)) {
                int statusCode = response.getStatusLine().getStatusCode();
                String responseBody = EntityUtils.toString(response.getEntity());
                
                logger.info("Firebase function response: function={}, statusCode={}, responseSize={}", 
                        functionName, statusCode, responseBody.length());

                if (statusCode < 400) {
                    logger.debug("Parsing successful response from Firebase function: {}", functionName);
                    CallFirebaseFunctionResponse parsedResponse = objectMapper.readValue(responseBody, CallFirebaseFunctionResponse.class);
                    logger.info("Successfully called Firebase function: {}", functionName);
                    return Optional.of(parsedResponse);
                } else {
                    logger.error("Error response from Firebase function {}: statusCode={}, response={}", 
                            functionName, statusCode, responseBody);
                    return Optional.empty();
                }
            }
        } catch (Exception e) {
            logger.error("Error calling Firebase function {}: {}", functionName, e.getMessage(), e);
            return Optional.empty();
        }
    }
}