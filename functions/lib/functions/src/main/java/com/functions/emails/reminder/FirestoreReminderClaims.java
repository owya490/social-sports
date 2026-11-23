package com.functions.emails.reminder;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Map;

import com.functions.emails.reminder.EmailReminderService.ReminderClaims;
import com.functions.firebase.services.FirebaseService;
import com.functions.firebase.services.FirebaseService.CollectionPaths;
import com.google.api.gax.rpc.AlreadyExistsException;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.Firestore;

final class FirestoreReminderClaims implements ReminderClaims {
    @Override
    public boolean claim(String eventId, LocalDate eventDate, String email) {
        DocumentReference ref = document(eventId, eventDate, email);
        try {
            return Boolean.TRUE.equals(FirebaseService.createFirestoreTransaction(transaction -> {
                if (transaction.get(ref).get().exists()) {
                    return false;
                }
                transaction.create(ref, Map.of(
                        "eventId", eventId,
                        "eventDate", eventDate.toString(),
                        "claimedAt", FieldValue.serverTimestamp()));
                return true;
            }));
        } catch (Exception e) {
            if (alreadyExists(e)) {
                return false;
            }
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            throw new IllegalStateException("Failed to claim reminder send for event " + eventId, e);
        }
    }

    @Override
    public void release(String eventId, LocalDate eventDate, String email) {
        try {
            document(eventId, eventDate, email).delete().get();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while releasing reminder claim for event " + eventId, e);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to release reminder claim for event " + eventId, e);
        }
    }

    private static DocumentReference document(String eventId, LocalDate eventDate, String email) {
        Firestore db = FirebaseService.getFirestore();
        return db.collection(CollectionPaths.EMAIL_REMINDER_SENDS).document(id(eventId, eventDate, email));
    }

    private static String id(String eventId, LocalDate eventDate, String email) {
        String key = eventId + "\n" + eventDate + "\n" + email.trim().toLowerCase(Locale.ROOT);
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(key.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is unavailable", e);
        }
    }

    private static boolean alreadyExists(Throwable error) {
        while (error != null) {
            if (error instanceof AlreadyExistsException) {
                return true;
            }
            error = error.getCause();
        }
        return false;
    }
}
