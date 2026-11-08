package com.functions.events.repositories;

import com.functions.events.exceptions.RecurrenceTemplateNotFoundException;
import com.functions.events.models.RecurrenceTemplate;
import com.functions.firebase.services.FirebaseService;
import com.functions.utils.JavaUtils;
import com.google.cloud.firestore.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.functions.firebase.services.FirebaseService.CollectionPaths.*;

public class RecurrenceTemplateRepository {
    private static final Logger logger = LoggerFactory.getLogger(RecurrenceTemplateRepository.class);
    private static final List<String> RECURRENCE_TEMPLATE_STATUSES = List.of(ACTIVE, INACTIVE, ARCHIVED);


    public static Optional<RecurrenceTemplate> getRecurrenceTemplate(String recurrenceTemplateId) {
        for (String status : RECURRENCE_TEMPLATE_STATUSES) {
            for (boolean isPrivate : List.of(true, false)) {
                DocumentReference recurrenceTemplateDocRef = recurrenceTemplateDocRef(
                        recurrenceTemplateId, status, isPrivate);
                try {
                    DocumentSnapshot snapshot = recurrenceTemplateDocRef.get().get();
                    if (snapshot.exists()) {
                        return readTemplate(snapshot, status);
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    throw new IllegalStateException("Interrupted while loading recurrence template "
                            + recurrenceTemplateId, e);
                } catch (ExecutionException e) {
                    throw new IllegalStateException("Failed to load recurrence template "
                            + recurrenceTemplateId, e);
                }
            }
        }
        return Optional.empty();
    }

    public static Optional<RecurrenceTemplate> getRecurrenceTemplateInTransaction(
            String recurrenceTemplateId, Transaction transaction) throws Exception {
        for (String status : RECURRENCE_TEMPLATE_STATUSES) {
            for (boolean isPrivate : List.of(true, false)) {
                DocumentReference recurrenceTemplateDocRef = recurrenceTemplateDocRef(
                        recurrenceTemplateId, status, isPrivate);
                DocumentSnapshot snapshot = transaction.get(recurrenceTemplateDocRef).get();
                if (snapshot.exists()) {
                    return readTemplate(snapshot, status);
                }
            }
        }
        return Optional.empty();
    }

    /**
     * Moves a template into RecurringEvents/Archived/{Public|Private}, matching the template's privacy.
     * Already-archived templates are left where they are.
     */
    public static String archiveRecurrenceTemplate(String recurrenceTemplateId, Transaction transaction)
            throws Exception {
        for (String status : List.of(ACTIVE, INACTIVE)) {
            for (boolean isPrivate : List.of(true, false)) {
                DocumentReference source = recurrenceTemplateDocRef(recurrenceTemplateId, status, isPrivate);
                DocumentSnapshot snapshot = transaction.get(source).get();
                if (!snapshot.exists()) {
                    continue;
                }
                RecurrenceTemplate current = snapshot.toObject(RecurrenceTemplate.class);
                if (current == null) {
                    throw new IllegalStateException("Recurrence template " + recurrenceTemplateId + " is empty");
                }
                RecurrenceTemplate archived = current.archivedCopy();
                boolean privacy = Boolean.TRUE.equals(archived.getEventData().getIsPrivate());
                DocumentReference destination = recurrenceTemplateDocRef(recurrenceTemplateId, ARCHIVED, privacy);
                transaction.set(destination, templateData(archived));
                transaction.delete(source);
                return recurrenceTemplateId;
            }
        }

        for (boolean isPrivate : List.of(true, false)) {
            DocumentSnapshot snapshot = transaction.get(
                    recurrenceTemplateDocRef(recurrenceTemplateId, ARCHIVED, isPrivate)).get();
            if (snapshot.exists()) {
                return recurrenceTemplateId;
            }
        }
        throw new RecurrenceTemplateNotFoundException(recurrenceTemplateId);
    }

    public static String createRecurrenceTemplate(boolean isActive, boolean isPrivate, RecurrenceTemplate recurrenceTemplate) throws ExecutionException, InterruptedException {
        DocumentReference recurrenceTemplateDocRef = getRecurrenceTemplateDocRef(isActive, isPrivate);
        recurrenceTemplateDocRef.create(templateData(recurrenceTemplate)).get();
        return recurrenceTemplateDocRef.getId();
    }

    public static String createRecurrenceTemplate(String recurrenceTemplateId, boolean isActive, boolean isPrivate, RecurrenceTemplate recurrenceTemplate) throws ExecutionException, InterruptedException {
        DocumentReference recurrenceTemplateDocRef = getRecurrenceTemplateDocRef(recurrenceTemplateId, isActive, isPrivate);
        recurrenceTemplateDocRef.create(templateData(recurrenceTemplate)).get();
        return recurrenceTemplateDocRef.getId();
    }

    public static String updateRecurrenceTemplate(String recurrenceTemplateId, RecurrenceTemplate recurrenceTemplate) throws ExecutionException, InterruptedException {
        return updateRecurrenceTemplate(recurrenceTemplateId, recurrenceTemplate, null);
    }

    public static String updateRecurrenceTemplate(String recurrenceTemplateId, RecurrenceTemplate recurrenceTemplate, Transaction transaction) throws ExecutionException, InterruptedException {
        boolean isPrivate = Boolean.TRUE.equals(recurrenceTemplate.getEventData().getIsPrivate());
        String status = statusFolder(recurrenceTemplate);
        DocumentReference recurrenceTemplateDocRef = recurrenceTemplateDocRef(recurrenceTemplateId, status, isPrivate);
        Map<String, Object> data = templateData(recurrenceTemplate);
        if (transaction == null) {
            recurrenceTemplateDocRef.set(data, SetOptions.merge()).get();
            if (ARCHIVED.equals(status)) {
                recurrenceTemplateDocRef(recurrenceTemplateId, ARCHIVED, !isPrivate).delete().get();
            }
        } else {
            transaction.set(recurrenceTemplateDocRef, data, SetOptions.merge());
            if (ARCHIVED.equals(status)) {
                transaction.delete(recurrenceTemplateDocRef(recurrenceTemplateId, ARCHIVED, !isPrivate));
            }
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

    public static Set<String> getAllActiveRecurrenceTemplateIds() {
        Firestore db = FirebaseService.getFirestore();

        final CollectionReference activePrivateRecurrenceTemplateRef = db.collection(RECURRING_EVENTS)
                .document(ACTIVE).collection(PRIVATE);
        final CollectionReference activePublicRecurrenceTemplateRef = db.collection(RECURRING_EVENTS)
                .document(ACTIVE).collection(PUBLIC);

        try {
            Set<String> privateTemplateIds = new java.util.HashSet<>();
            for (DocumentReference docRef : activePrivateRecurrenceTemplateRef.listDocuments()) {
                privateTemplateIds.add(docRef.getId());
            }

            Set<String> publicTemplateIds = new java.util.HashSet<>();
            for (DocumentReference docRef : activePublicRecurrenceTemplateRef.listDocuments()) {
                publicTemplateIds.add(docRef.getId());
            }

            Set<String> allTemplateIds = new java.util.HashSet<>(privateTemplateIds);
            allTemplateIds.addAll(publicTemplateIds);

            return allTemplateIds;
        } catch (Exception e) {
            logger.error("Unable to get all active recurrence template IDs", e);
        }
        return Set.of();
    }


    /**
     * Drops the in-memory archived flag so writes do not add a field that older
     * function revisions cannot read.
     */
    private static Map<String, Object> templateData(RecurrenceTemplate template) {
        Map<String, Object> data = JavaUtils.toMap(template);
        data.remove("archived");
        return data;
    }

    private static Optional<RecurrenceTemplate> readTemplate(DocumentSnapshot snapshot, String status) {
        RecurrenceTemplate template = snapshot.toObject(RecurrenceTemplate.class);
        if (template != null && ARCHIVED.equals(status)) {
            template = template.toBuilder().archived(true).build();
        }
        return Optional.ofNullable(template);
    }

    static String statusFolder(RecurrenceTemplate template) {
        if (template != null && Boolean.TRUE.equals(template.getArchived())) {
            return ARCHIVED;
        }
        boolean isActive = template != null
                && template.getEventData() != null
                && Boolean.TRUE.equals(template.getEventData().getIsActive());
        return isActive ? ACTIVE : INACTIVE;
    }

    private static DocumentReference getRecurrenceTemplateDocRef(boolean isActive, boolean isPrivate) {
        return recurrenceTemplateDocRef(isActive ? ACTIVE : INACTIVE, isPrivate);
    }

    private static DocumentReference getRecurrenceTemplateDocRef(String recurrenceTemplateId, boolean isActive, boolean isPrivate) {
        return recurrenceTemplateDocRef(recurrenceTemplateId, isActive ? ACTIVE : INACTIVE, isPrivate);
    }

    private static DocumentReference recurrenceTemplateDocRef(String status, boolean isPrivate) {
        Firestore db = FirebaseService.getFirestore();
        return db.collection(RECURRING_EVENTS)
                .document(status)
                .collection(isPrivate ? PRIVATE : PUBLIC)
                .document();
    }

    private static DocumentReference recurrenceTemplateDocRef(String recurrenceTemplateId, String status, boolean isPrivate) {
        Firestore db = FirebaseService.getFirestore();
        return db.collection(RECURRING_EVENTS)
                .document(status)
                .collection(isPrivate ? PRIVATE : PUBLIC)
                .document(recurrenceTemplateId);
    }


}
