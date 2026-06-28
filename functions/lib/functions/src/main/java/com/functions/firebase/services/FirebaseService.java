package com.functions.firebase.services;

import static com.functions.utils.JavaUtils.objectMapper;

import java.io.FileInputStream;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.global.handlers.Global;
import com.google.api.core.ApiFuture;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Transaction;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import com.posthog.java.PostHog;

import lombok.Getter;
import com.functions.utils.logging.RequestLogContext;

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
        public static final String TICKETS = "Tickets";
        public static final String ORDERS = "Orders";
        public static final String ATTENDEES = "Attendees";
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
            logger.error("Error initializing FirebaseService", e);
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

        posthog = new PostHog.Builder(posthogApiKey).host(posthogHost).build();
    }

    public static Firestore getFirestore() {
        return db;
    }

    public record FirestoreTransactionLogContext(String operationName, Map<String, ?> fields) {
        public FirestoreTransactionLogContext {
            operationName = operationName == null || operationName.isBlank()
                    ? "firestoreTransaction"
                    : operationName;
            fields = fields == null
                    ? Map.of()
                    : Collections.unmodifiableMap(new LinkedHashMap<>(fields));
        }
    }

    public static FirestoreTransactionLogContext transactionLog(String operationName, Map<String, ?> fields) {
        return new FirestoreTransactionLogContext(operationName, fields);
    }

    public static <T> T createFirestoreTransaction(Transaction.Function<T> consumer) throws Exception {
        return createFirestoreTransaction(transactionLog("firestoreTransaction", Map.of()), consumer);
    }

    public static <T> T createFirestoreTransaction(
            FirestoreTransactionLogContext transactionLogContext,
            Transaction.Function<T> consumer) throws Exception {
        Firestore db = FirebaseService.getFirestore();
        long startNanos = System.nanoTime();
        RequestLogContext logContext = RequestLogContext.current();
        FirestoreTransactionLogContext safeTransactionLogContext = transactionLogContext == null
                ? transactionLog("firestoreTransaction", Map.of())
                : transactionLogContext;

        ApiFuture<T> futureTransaction = db.runTransaction(consumer);
        try {
            // Wait for the transaction to complete
            T result = futureTransaction.get(30, TimeUnit.SECONDS);
            long durationMs = (System.nanoTime() - startNanos) / 1_000_000;
            logger.info("Firestore transaction completed {}",
                    logContext.formatWithFields(
                            safeTransactionLogContext.fields(),
                            "event", "firestore_transaction_completed",
                            "operation", safeTransactionLogContext.operationName(),
                            "durationMs", durationMs,
                            "resultType", result == null ? "null" : result.getClass().getSimpleName()));
            return result;
        } catch (ExecutionException e) {
            long durationMs = (System.nanoTime() - startNanos) / 1_000_000;
            logger.warn("Firestore transaction failed {}",
                    logContext.formatWithFields(
                            safeTransactionLogContext.fields(),
                            "event", "firestore_transaction_failed",
                            "operation", safeTransactionLogContext.operationName(),
                            "durationMs", durationMs,
                            "exceptionType", e.getCause() == null ? e.getClass().getSimpleName() : e.getCause().getClass().getSimpleName()));
            // Unwrap the ExecutionException to expose the original exception
            // This allows specific exception handlers (e.g., CheckoutVacancyException) to catch it
            Throwable cause = e.getCause();
            if (cause instanceof Exception) {
                throw (Exception) cause;
            }
            throw e;
        } catch (Exception e) {
            long durationMs = (System.nanoTime() - startNanos) / 1_000_000;
            logger.warn("Firestore transaction failed {}",
                    logContext.formatWithFields(
                            safeTransactionLogContext.fields(),
                            "event", "firestore_transaction_failed",
                            "operation", safeTransactionLogContext.operationName(),
                            "durationMs", durationMs,
                            "exceptionType", e.getClass().getSimpleName()));
            throw e;
        }
    }
}
