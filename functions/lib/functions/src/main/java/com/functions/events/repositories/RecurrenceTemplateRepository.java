package com.functions.events.repositories;

import com.functions.events.models.RecurrenceTemplate;
import com.functions.firebase.services.FirebaseService;
import com.functions.utils.JavaUtils;
import com.google.cloud.firestore.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.functions.firebase.services.FirebaseService.CollectionPaths.*;

public class RecurrenceTemplateRepository {
    private static final Logger logger = LoggerFactory.getLogger(RecurrenceTemplateRepository.class);


    public static Optional<RecurrenceTemplate> getRecurrenceTemplate(String recurrenceTemplateId) {
        return getRecurrenceTemplate(recurrenceTemplateId, null);
    }

    public static Optional<RecurrenceTemplate> getRecurrenceTemplate(String recurrenceTemplateId, Transaction transaction) {
        Optional<RecurrenceTemplate> maybeRecurrenceTemplate;
        // 1. Try Active Private Recurrence Templates

        maybeRecurrenceTemplate = getRecurrenceTemplate(recurrenceTemplateId, true, true, transaction);
        if (maybeRecurrenceTemplate.isPresent()) {
            return maybeRecurrenceTemplate;
        }

        // 2. Try Active Public Recurrence Templates
        maybeRecurrenceTemplate = getRecurrenceTemplate(recurrenceTemplateId, true, false, transaction);
        if (maybeRecurrenceTemplate.isPresent()) {
            return maybeRecurrenceTemplate;
        }
        // 3. Try InActive Private Recurrence Templates
        maybeRecurrenceTemplate = getRecurrenceTemplate(recurrenceTemplateId, false, true, transaction);
        if (maybeRecurrenceTemplate.isPresent()) {
            return maybeRecurrenceTemplate;
        }
        // 4. Try InActive Public Recurrence Templates
        maybeRecurrenceTemplate = getRecurrenceTemplate(recurrenceTemplateId, false, false, transaction);
        return maybeRecurrenceTemplate;
    }

    public static Optional<RecurrenceTemplate> getRecurrenceTemplate(String recurrenceTemplateId, boolean isActive, boolean isPrivate) {
        return getRecurrenceTemplate(recurrenceTemplateId, isActive, isPrivate, null);
    }

    public static Optional<RecurrenceTemplate> getRecurrenceTemplate(String recurrenceTemplateId, boolean isActive, boolean isPrivate, Transaction transaction) {
        DocumentReference recurrenceTemplateDocRef = getRecurrenceTemplateDocRef(recurrenceTemplateId, isActive, isPrivate);
        try {
            DocumentSnapshot maybeSnapshot;
            if (transaction == null) {
                maybeSnapshot = recurrenceTemplateDocRef.get().get();
            } else {
                maybeSnapshot = transaction.get(recurrenceTemplateDocRef).get();
            }
            if (maybeSnapshot.exists()) {
                return Optional.ofNullable(maybeSnapshot.toObject(RecurrenceTemplate.class));
            }
        }
        catch (InterruptedException | ExecutionException ignored) {
            // No op, no retries for now
        }
        return Optional.empty();
    }

    public static String createRecurrenceTemplate(boolean isActive, boolean isPrivate, RecurrenceTemplate recurrenceTemplate) throws ExecutionException, InterruptedException {
        DocumentReference recurrenceTemplateDocRef = getRecurrenceTemplateDocRef(isActive, isPrivate);
        recurrenceTemplateDocRef.create(recurrenceTemplate).get();
        return recurrenceTemplateDocRef.getId();
    }

    public static String createRecurrenceTemplate(String recurrenceTemplateId, boolean isActive, boolean isPrivate, RecurrenceTemplate recurrenceTemplate) throws ExecutionException, InterruptedException {
        DocumentReference recurrenceTemplateDocRef = getRecurrenceTemplateDocRef(recurrenceTemplateId, isActive, isPrivate);
        recurrenceTemplateDocRef.create(recurrenceTemplate).get();
        return recurrenceTemplateDocRef.getId();
    }

    public static String updateRecurrenceTemplate(String recurrenceTemplateId, RecurrenceTemplate recurrenceTemplate) throws ExecutionException, InterruptedException {
        return updateRecurrenceTemplate(recurrenceTemplateId, recurrenceTemplate, null);
    }

    public static String updateRecurrenceTemplate(String recurrenceTemplateId, RecurrenceTemplate recurrenceTemplate, Transaction transaction) throws ExecutionException, InterruptedException {
        boolean isActive = recurrenceTemplate.getEventData().getIsActive();
        boolean isPrivate = recurrenceTemplate.getEventData().getIsPrivate();
        DocumentReference recurrenceTemplateDocRef = getRecurrenceTemplateDocRef(recurrenceTemplateId, isActive, isPrivate);
        if (transaction == null) {
            recurrenceTemplateDocRef.set(recurrenceTemplate, SetOptions.merge()).get();
        } else {
            transaction.set(recurrenceTemplateDocRef, JavaUtils.toMap(recurrenceTemplate), SetOptions.merge());
        }
        return recurrenceTemplateDocRef.getId();
    }

    public static String deleteRecurrenceTemplate(String recurrenceTemplateId, boolean isActive, boolean isPrivate) throws ExecutionException, InterruptedException {
        return deleteRecurrenceTemplate(recurrenceTemplateId, isActive, isPrivate, null);
    }

    public static String deleteRecurrenceTemplate(String recurrenceTemplateId, boolean isActive, boolean isPrivate, Transaction transaction) throws ExecutionException, InterruptedException {
        DocumentReference recurrenceTemplateDocRef = getRecurrenceTemplateDocRef(recurrenceTemplateId, isActive, isPrivate);
        if (transaction == null) {
            recurrenceTemplateDocRef.delete().get();
        } else {
            transaction.delete(recurrenceTemplateDocRef);
        }
        return recurrenceTemplateDocRef.getId();
    }

    public static String moveRecurrenceTemplateToActive(String recurrenceTemplateId, RecurrenceTemplate recurrenceTemplate) throws ExecutionException, InterruptedException {
        boolean isRecurrencePrivate = recurrenceTemplate.getEventData().getIsPrivate();
        
        // 1. Update the recurrence template back to active
        recurrenceTemplate.getEventData().setIsActive(true);
        // 2. Recreate the recurrence template in the active folder with the same ID
        createRecurrenceTemplate(recurrenceTemplateId, true, isRecurrencePrivate, recurrenceTemplate);
        // 3. Delete the old recurrence template in the inactive folder with the same ID
        deleteRecurrenceTemplate(recurrenceTemplateId, false, isRecurrencePrivate);

        return recurrenceTemplateId;
    }


    public static Map<String, RecurrenceTemplate> getAllActiveRecurrenceTemplates() {
        Firestore db = FirebaseService.getFirestore();

        final CollectionReference activePrivateRecurrenceTemplateRef = db.collection(RECURRING_EVENTS)
                .document(ACTIVE).collection(PRIVATE);
        final CollectionReference activePublicRecurrenceTemplateRef = db.collection(RECURRING_EVENTS)
                .document(ACTIVE).collection(PUBLIC);

        try {
            return Stream.concat(
                    activePrivateRecurrenceTemplateRef.get().get().getDocuments().stream(),
                    activePublicRecurrenceTemplateRef.get().get().getDocuments().stream()
            ).map(snapshot -> Map.entry(snapshot.getId(), snapshot.toObject(RecurrenceTemplate.class)))
                    .collect(Collectors.toMap(
                            Map.Entry::getKey,
                            Map.Entry::getValue
                    ));
        } catch (InterruptedException | ExecutionException e) {
            //Noop
            logger.error("Unable to get all active recurrence templates", e);
        }
        return Map.of();
    }

    // TODO make this more efficient
    public static Set<String> getAllActiveRecurrenceTemplateIds() {
        return getAllActiveRecurrenceTemplates().keySet();
    }



    private static DocumentReference getRecurrenceTemplateDocRef(boolean isActive, boolean isPrivate) {
        Firestore db = FirebaseService.getFirestore();
        return db.collection(RECURRING_EVENTS)
                .document(isActive ? ACTIVE : INACTIVE)
                .collection(isPrivate ? PRIVATE : PUBLIC)
                .document();
    }

    private static DocumentReference getRecurrenceTemplateDocRef(String recurrenceTemplateId, boolean isActive, boolean isPrivate) {
        Firestore db = FirebaseService.getFirestore();
        return db.collection(RECURRING_EVENTS)
                .document(isActive ? ACTIVE : INACTIVE)
                .collection(isPrivate ? PRIVATE : PUBLIC)
                .document(recurrenceTemplateId);
    }


}
