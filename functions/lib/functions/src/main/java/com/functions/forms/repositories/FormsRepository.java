package com.functions.forms.repositories;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.firebase.services.FirebaseService;
import com.functions.forms.models.FormResponse;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;

public class FormsRepository {
    private static final Logger logger = LoggerFactory.getLogger(FormsRepository.class);

    /**
     * Retrieves a FormResponse by searching through all possible collection paths.
     * The form response structure is: path/{formId}/{eventId}/{formResponseId}
     * 
     * @param formId         The form ID
     * @param eventId        The event ID
     * @param formResponseId The form response ID
     * @return Optional containing the FormResponse if found, empty otherwise
     */
    public static Optional<FormResponse> getFormResponseById(String formId, String eventId, String formResponseId) {
        try {
            DocumentSnapshot formResponseSnapshot = findFormResponseDocumentSnapshot(formId, eventId, formResponseId,
                    Optional.empty());
            FormResponse formResponse = FormResponse.fromFirestore(formResponseSnapshot);

            return Optional.of(formResponse);
        } catch (Exception e) {
            logger.error("Error retrieving form response by IDs - formId: {}, eventId: {}, formResponseId: {}",
                    formId, eventId, formResponseId, e);
            return Optional.empty();
        }
    }

    private static DocumentSnapshot findFormResponseDocumentSnapshot(String formId, String eventId,
            String formResponseId, Optional<List<String>> formResponsePaths) throws Exception {
        Firestore db = FirebaseService.getFirestore();
        try {
            for (String path : formResponsePaths.orElse(FirebaseService.CollectionPaths.FORM_RESPONSE_PATHS)) {
                DocumentReference docRef = db.document(path + "/" + formId + "/" + eventId + "/" + formResponseId);
                DocumentSnapshot maybeDocSnapshot = docRef.get().get();
                if (maybeDocSnapshot.exists()) {
                    logger.info("Found form response document - formId: {}, eventId: {}, formResponseId: {}, path: {}",
                            formId, eventId, formResponseId, path);
                    return maybeDocSnapshot;
                }
            }

            // If no document is found, log and throw an exception
            logger.error(
                    "No form response document found in any subcollection - formId: {}, eventId: {}, formResponseId: {}",
                    formId, eventId, formResponseId);
            throw new Exception("No form response document found - formId: " + formId + ", eventId: " + eventId
                    + ", formResponseId: " + formResponseId);
        } catch (Exception e) {
            logger.error("Error finding form response document - formId: {}, eventId: {}, formResponseId: {}",
                    formId, eventId, formResponseId, e);
            throw new Exception("Could not find form response document - formId: " + formId + ", eventId: " + eventId
                    + ", formResponseId: " + formResponseId, e);
        }
    }

    public static void deleteTempFormResponse(String formId, String eventId, String formResponseId) throws Exception {
        try {
            DocumentSnapshot formResponseSnapshot = findFormResponseDocumentSnapshot(formId, eventId,
                    formResponseId, Optional.of(List.of(FirebaseService.CollectionPaths.TEMP_FORM_RESPONSE_PATH)));
            if (formResponseSnapshot.exists()) {
                DocumentReference docRef = formResponseSnapshot.getReference();
                docRef.delete().get();
                logger.info("Deleted temporary form response - formId: {}, eventId: {}, formResponseId: {}",
                        formId, eventId, formResponseId);
            } else {
                logger.warn("Form response not found for deletion - formId: {}, eventId: {}, formResponseId: {}",
                        formId, eventId, formResponseId);
            }
        } catch (Exception e) {
            logger.error("Error deleting temporary form response - formId: {}, eventId: {}, formResponseId: {}",
                    formId, eventId, formResponseId, e);
            throw new Exception("Could not delete temporary form response - formId: " + formId + ", eventId: " + eventId
                    + ", formResponseId: " + formResponseId, e);
        }
    }

    public static void copyTempFormResponseToSubmitted(String formId, String eventId, String formResponseId)
            throws Exception {
        try {
            DocumentSnapshot tempResponseSnapshot = findFormResponseDocumentSnapshot(formId, eventId,
                    formResponseId, Optional.of(List.of(FirebaseService.CollectionPaths.TEMP_FORM_RESPONSE_PATH)));
            if (tempResponseSnapshot.exists()) {
                DocumentReference tempDocRef = tempResponseSnapshot.getReference();
                DocumentReference submittedDocRef = FirebaseService.getFirestore()
                        .document(FirebaseService.CollectionPaths.SUBMITTED_FORM_RESPONSE_PATH + "/" + formId + "/"
                                + eventId + "/" + formResponseId);
                Map<String, Object> maybeData = tempResponseSnapshot.getData();
                if (maybeData == null) {
                    throw new Exception("Temporary form response data is null - formId: " + formId + ", eventId: "
                            + eventId + ", formResponseId: " + formResponseId);
                }
                submittedDocRef.set(maybeData).get();
                tempDocRef.delete().get();
                logger.info("Copied temporary form response to submitted - formId: {}, eventId: {}, formResponseId: {}",
                        formId, eventId, formResponseId);
            } else {
                logger.warn(
                        "Temporary form response not found for copying - formId: {}, eventId: {}, formResponseId: {}",
                        formId, eventId, formResponseId);
            }
        } catch (Exception e) {
            logger.error(
                    "Error copying temporary form response to submitted - formId: {}, eventId: {}, formResponseId: {}",
                    formId, eventId, formResponseId, e);
            throw new Exception(
                    "Could not copy temporary form response to submitted - formId: " + formId + ", eventId: "
                            + eventId + ", formResponseId: " + formResponseId,
                    e);
        }
    }
}
