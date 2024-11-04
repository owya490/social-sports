package com.functions;

import java.util.List;

import java.io.FileInputStream;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.logging.Logging;
import com.google.cloud.logging.LoggingOptions;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import com.posthog.java.PostHog;

public class FirebaseService {

    public class CollectionPaths {
        public static final String EVENTS = "Events";
        public static final String ACTIVE = "Active";
        public static final String INACTIVE = "InActive";
        public static final String PRIVATE = "Private";
        public static final String PUBLIC = "Public";
        public static final String USERS = "Users";

        public static final String EVENTS_METADATA = "EventsMetadata";

        public static final String RECURRING_EVENTS = "RecurringEvents";
    }

    private static final Logger logger = LoggerFactory.getLogger(FirebaseService.class);

    private static Firestore db;
    private static Logging logging;
    private static String posthogApiKey;
    private static String posthogHost;
    private static String firebaseProject;
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
        posthogApiKey = System.getenv("POSTHOG_API_KEY");
        posthogHost = "https://app.posthog.com";
        firebaseProject = System.getenv("PROJECT_NAME");

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

    public static Logging getLogging() {
        return logging;
    }

    public static String getPosthogApiKey() {
        return posthogApiKey;
    }

    public static String getFirebaseProject() {
        return firebaseProject;
    }

    public static PostHog getPosthog() {
        return posthog;
    }
}
