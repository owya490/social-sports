package com.functions;

import java.io.FileInputStream;
import java.io.IOException;

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
    private static final Logger logger = LoggerFactory.getLogger(FirebaseService.class);

    private static Firestore db;
    private static Logging logging;
    private static String posthogApiKey;
    private static String posthogHost;
    private static String firebaseProject;
    private static PostHog posthog;

    static {
        try {
            initialize();
        } catch (IOException e) {
            logger.error("Error initializing FirebaseService: " + e.getMessage());
        }
    }

    private static void initialize() throws IOException {
        String credentialsPath = "./functions_key.json";
        posthogApiKey = System.getenv("POSTHOG_API_KEY");
        posthogHost = "https://app.posthog.com";
        firebaseProject = System.getenv("PROJECT_NAME");

        if (firebaseProject == null) {
            logger.error("Firebase project name is not set in the environment variables.");
            return;
        }

        FileInputStream serviceAccount = new FileInputStream(credentialsPath);
        FirebaseOptions options = new FirebaseOptions.Builder()
                .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                .setProjectId(firebaseProject)
                .build();
        FirebaseApp.initializeApp(options);
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
}
