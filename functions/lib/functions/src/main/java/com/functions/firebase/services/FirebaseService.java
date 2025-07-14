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
import com.functions.global.services.Global;
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
                "Events/InActive/Private"
        );
        public static final String FULFILMENT_SESSIONS_ROOT_PATH = "FulfilmentSessions";
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
            if (FirebaseApp.getApps().isEmpty()) {
                initialize();
            }
        } catch (Exception e) {
            logger.error("Error initializing FirebaseService: " + e.getMessage());
        }
    }

    /**
     * Initializes Firebase, Firestore, Google Cloud Logging, and PostHog analytics clients using environment variables and service account credentials.
     *
     * @throws Exception if the Firebase project name is not set or if Firebase initialization fails.
     */
    private static void initialize() throws Exception {
        String credentialsPath = "functions_key.json";
        posthogApiKey = Global.getEnv("POSTHOG_API_KEY");
        posthogHost = "https://app.posthog.com";
        firebaseProject = Global.getEnv("PROJECT_NAME");

        if (firebaseProject == null) {
            logger.error("Firebase project name is not set in the environment variables.");
            throw new Exception("Firebase project name is not set in the environment variables.");
        }

        FileInputStream serviceAccount = new FileInputStream(credentialsPath);
        FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                .setProjectId(firebaseProject)
                .build();
        boolean hasBeenInitialised = false;
        List<FirebaseApp> firebaseApps = FirebaseApp.getApps();
        for (FirebaseApp app : firebaseApps) {
            if (app.getName().equals(FirebaseApp.DEFAULT_APP_NAME)) {
                hasBeenInitialised = true;
            }
        }
        if (!hasBeenInitialised) {
            FirebaseApp.initializeApp(options);
        }

        if (FirebaseApp.getApps().isEmpty()) {
            throw new Exception("Firebase not initialized");
        }
        db = FirestoreClient.getFirestore();
        logging = LoggingOptions.getDefaultInstance().getService();

        posthog = new PostHog.Builder(posthogApiKey).host(posthogHost).build();
    }

    /**
     * Returns the Firestore database instance used for Firebase operations.
     *
     * @return the Firestore client instance
     */
    public static Firestore getFirestore() {
        return db;
    }

    /**
     * Invokes a Firebase Cloud Function by name with the provided request data and returns the parsed response.
     *
     * @param functionName the name of the Firebase Cloud Function to call
     * @param requestData the data to send as the request payload
     * @return an {@code Optional} containing the {@code CallFirebaseFunctionResponse} if the call succeeds and returns a valid response; otherwise, an empty {@code Optional}
     */
    public static Optional<CallFirebaseFunctionResponse> callFirebaseFunction(String functionName, Object requestData) {
        try (CloseableHttpClient client = HttpClients.createDefault()) {
            String functionUrl = String.format("https://%s-%s.cloudfunctions.net/%s", REGION, System.getenv("PROJECT_NAME"), functionName);

            HttpPost post = new HttpPost(functionUrl);
            post.setHeader("Content-Type", "application/json");

            String jsonData = objectMapper.writeValueAsString(new CallFirebaseFunctionRequest(requestData));
            post.setEntity(new StringEntity(jsonData));

            try (CloseableHttpResponse response = client.execute(post)) {
                int statusCode = response.getStatusLine().getStatusCode();
                String responseBody = EntityUtils.toString(response.getEntity());

                if (statusCode < 400) {
                    return Optional.of(objectMapper.readValue(responseBody, CallFirebaseFunctionResponse.class));
                } else {
                    logger.error("Error response from Firebase function {}: {}", functionName, responseBody);
                    return Optional.empty();
                }
            }
        } catch (Exception e) {
            logger.error("Error calling Firebase function {}: {}", functionName, e.getMessage(), e);
            return Optional.empty();
        }
    }
}