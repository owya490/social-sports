package com.functions.firebase.services;

import com.functions.Global;
import com.functions.firebase.models.requests.CallFirebaseFunctionRequest;
import com.functions.firebase.models.responses.CallFirebaseFunctionResponse;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.logging.Logging;
import com.google.cloud.logging.LoggingOptions;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import com.posthog.java.PostHog;
import lombok.Getter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.FileInputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;

import static com.functions.utils.JavaUtils.objectMapper;

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

    public static Firestore getFirestore() {
        return db;
    }

    public static Optional<CallFirebaseFunctionResponse> callFirebaseFunction(String functionName, Object requestData) {
        try {
            String functionUrl = String.format("https://%s-%s.cloudfunctions.net/%s", REGION, System.getenv("PROJECT_NAME"), functionName);
            URL url = new URL(functionUrl);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();

            // Configure connection
            connection.setRequestMethod("POST");
            connection.setDoOutput(true);
            connection.setRequestProperty("Content-Type", "application/json");

            String jsonData = objectMapper.writeValueAsString(
                    new CallFirebaseFunctionRequest(requestData)
            );

            // Send request body
            try (OutputStream os = connection.getOutputStream()) {
                byte[] input = jsonData.getBytes(StandardCharsets.UTF_8);
                os.write(input);
            }

            // Read response
            int status = connection.getResponseCode();
            InputStream responseStream = (status < 400) ? connection.getInputStream() : connection.getErrorStream();
            CallFirebaseFunctionResponse response;
            try {
                response = objectMapper.readValue(responseStream, CallFirebaseFunctionResponse.class);
            } catch (Exception e) {
                logger.error("Could not parse input", e);
                return Optional.empty();
            }

            return Optional.of(response);

//            try (BufferedReader reader = new BufferedReader(new InputStreamReader(responseStream))) {
//                StringBuilder response = new StringBuilder();
//                String line;
//                while ((line = reader.readLine()) != null) {
//                    response.append(line);
//                }
//                return Optional.of(response.toString());
//            }
        } catch (Exception e) {
            logger.error("Error calling Firebase function {}: {}", functionName, e.getMessage(), e);
            return Optional.empty();
        }
    }
}
