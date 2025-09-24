package com.functions.forms.repositories;

import com.functions.firebase.services.FirebaseService;
import com.functions.forms.models.FormResponse;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.List;
import java.util.Optional;

public class FormsRepository {
        private static final Logger logger = LoggerFactory.getLogger(FormsRepository.class);

        /**
         * Retrieves a FormResponse by searching through all possible collection paths. The form
         * response structure is: path/{formId}/{eventId}/{formResponseId}
         * 
         * @param formId The form ID
         * @param eventId The event ID
         * @param formResponseId The form response ID
         * @return Optional containing the FormResponse if found, empty otherwise
         */
        public static Optional<FormResponse> getFormResponseById(String formId, String eventId,
                        String formResponseId) {
                logger.debug("Retrieving form response - formId: {}, eventId: {}, formResponseId: {}",
                                formId, eventId, formResponseId);

                if (formId == null || eventId == null || formResponseId == null) {
                        logger.warn("Invalid parameters for getFormResponseById - formId: {}, eventId: {}, formResponseId: {}",
                                        formId, eventId, formResponseId);
                        return Optional.empty();
                }

                try {
                        DocumentSnapshot formResponseSnapshot = findFormResponseDocumentSnapshot(
                                        formId, eventId, formResponseId, Optional.empty());
                        FormResponse formResponse =
                                        FormResponse.fromFirestore(formResponseSnapshot);

                        logger.info("Successfully retrieved form response - formId: {}, eventId: {}, formResponseId: {}",
                                        formId, eventId, formResponseId);
                        return Optional.of(formResponse);
                } catch (Exception e) {
                        logger.error("Error retrieving form response by IDs - formId: {}, eventId: {}, formResponseId: {}",
                                        formId, eventId, formResponseId, e);
                        return Optional.empty();
                }
        }

        private static DocumentSnapshot findFormResponseDocumentSnapshot(String formId,
                        String eventId, String formResponseId,
                        Optional<List<String>> formResponsePaths) throws Exception {
                logger.debug("Searching for form response document - formId: {}, eventId: {}, formResponseId: {}",
                                formId, eventId, formResponseId);

                Firestore db = FirebaseService.getFirestore();
                List<String> pathsToSearch = formResponsePaths
                                .orElse(FirebaseService.CollectionPaths.FORM_RESPONSE_PATHS);
                logger.debug("Searching {} collection paths", pathsToSearch.size());

                try {
                        for (String path : pathsToSearch) {
                                logger.debug("Checking path: {}", path);
                                DocumentReference docRef = db.document(path + "/" + formId + "/"
                                                + eventId + "/" + formResponseId);
                                DocumentSnapshot maybeDocSnapshot = docRef.get().get();
                                if (maybeDocSnapshot.exists()) {
                                        logger.info("Found form response document - formId: {}, eventId: {}, formResponseId: {}, path: {}",
                                                        formId, eventId, formResponseId, path);
                                        return maybeDocSnapshot;
                                }
                        }
                        logger.warn("No form response document found after searching {} paths - formId: {}, eventId: {}, formResponseId: {}",
                                        pathsToSearch.size(), formId, eventId, formResponseId);
                        throw new Exception("No form response document found - formId: " + formId
                                        + ", eventId: " + eventId + ", formResponseId: "
                                        + formResponseId);
                } catch (Exception e) {
                        logger.error("Error finding form response document - formId: {}, eventId: {}, formResponseId: {}",
                                        formId, eventId, formResponseId, e);
                        throw new Exception("Could not find form response document - formId: "
                                        + formId + ", eventId: " + eventId + ", formResponseId: "
                                        + formResponseId, e);
                }
        }

        public static void deleteTempFormResponse(String formId, String eventId,
                        String formResponseId) throws Exception {
                logger.debug("Deleting temporary form response - formId: {}, eventId: {}, formResponseId: {}",
                                formId, eventId, formResponseId);

                if (formId == null || eventId == null || formResponseId == null) {
                        logger.error("Invalid parameters for deleteTempFormResponse - formId: {}, eventId: {}, formResponseId: {}",
                                        formId, eventId, formResponseId);
                        throw new IllegalArgumentException(
                                        "formId, eventId, and formResponseId must not be null");
                }

                try {
                        DocumentSnapshot formResponseSnapshot = findFormResponseDocumentSnapshot(
                                        formId, eventId, formResponseId, Optional.of(List.of(
                                                        FirebaseService.CollectionPaths.TEMP_FORM_RESPONSE_PATH)));
                        if (formResponseSnapshot.exists()) {
                                DocumentReference docRef = formResponseSnapshot.getReference();
                                docRef.delete().get();
                                logger.info("Successfully deleted temporary form response - formId: {}, eventId: {}, formResponseId: {}",
                                                formId, eventId, formResponseId);
                        } else {
                                logger.warn("Temporary form response not found for deletion - formId: {}, eventId: {}, formResponseId: {}",
                                                formId, eventId, formResponseId);
                        }
                } catch (Exception e) {
                        logger.error("Error deleting temporary form response - formId: {}, eventId: {}, formResponseId: {}",
                                        formId, eventId, formResponseId, e);
                        throw new Exception("Could not delete temporary form response - formId: "
                                        + formId + ", eventId: " + eventId + ", formResponseId: "
                                        + formResponseId, e);
                }
        }

        /**
         * Retrieves a temporary FormResponse by ID
         * 
         * @param formId The form ID
         * @param eventId The event ID
         * @param formResponseId The form response ID
         * @return FormResponse if found
         * @throws Exception if form response not found or invalid parameters
         */
        public static FormResponse getTempFormResponseById(String formId, String eventId,
                        String formResponseId) throws Exception {
                logger.debug("Retrieving temporary form response - formId: {}, eventId: {}, formResponseId: {}",
                                formId, eventId, formResponseId);

                if (formId == null || eventId == null || formResponseId == null) {
                        logger.error("Invalid parameters for getTempFormResponseById - formId: {}, eventId: {}, formResponseId: {}",
                                        formId, eventId, formResponseId);
                        throw new IllegalArgumentException(
                                        "formId, eventId, and formResponseId must not be null");
                }

                try {
                        DocumentSnapshot formResponseSnapshot = findFormResponseDocumentSnapshot(
                                        formId, eventId, formResponseId, Optional.of(List.of(
                                                        FirebaseService.CollectionPaths.TEMP_FORM_RESPONSE_PATH)));
                        FormResponse formResponse =
                                        FormResponse.fromFirestore(formResponseSnapshot);
                        logger.info("Successfully retrieved temporary form response - formId: {}, eventId: {}, formResponseId: {}",
                                        formId, eventId, formResponseId);
                        return formResponse;
                } catch (Exception e) {
                        logger.error("Error retrieving temporary form response by IDs - formId: {}, eventId: {}, formResponseId: {}",
                                        formId, eventId, formResponseId, e);
                        throw new Exception("Could not retrieve temporary form response - formId: "
                                        + formId + ", eventId: " + eventId + ", formResponseId: "
                                        + formResponseId, e);
                }
        }

        /**
         * Saves a FormResponse to the submitted collection
         * 
         * @param formResponse The FormResponse to save
         * @throws Exception if there's an error saving the form response
         */
        public static void saveSubmittedFormResponse(FormResponse formResponse) throws Exception {
                if (formResponse == null) {
                        logger.error("Cannot save null form response to submitted collection");
                        throw new IllegalArgumentException("FormResponse cannot be null");
                }

                logger.debug("Saving submitted form response - formId: {}, eventId: {}, formResponseId: {}",
                                formResponse.getFormId(), formResponse.getEventId(),
                                formResponse.getFormResponseId());

                try {
                        Firestore db = FirebaseService.getFirestore();

                        String docPath = FirebaseService.CollectionPaths.SUBMITTED_FORM_RESPONSE_PATH
                                        + "/" + formResponse.getFormId() + "/"
                                        + formResponse.getEventId() + "/"
                                        + formResponse.getFormResponseId();
                        logger.debug("Document path for submitted form response: {}", docPath);

                        DocumentReference docRef = db.document(docPath);
                        docRef.set(formResponse).get();

                        logger.info("Successfully saved submitted form response - formId: {}, eventId: {}, formResponseId: {}",
                                        formResponse.getFormId(), formResponse.getEventId(),
                                        formResponse.getFormResponseId());
                } catch (Exception e) {
                        logger.error("Error saving submitted form response - formId: {}, eventId: {}, formResponseId: {}",
                                        formResponse.getFormId(), formResponse.getEventId(),
                                        formResponse.getFormResponseId(), e);
                        throw new Exception("Could not save submitted form response - formId: "
                                        + formResponse.getFormId() + ", eventId: "
                                        + formResponse.getEventId() + ", formResponseId: "
                                        + formResponse.getFormResponseId(), e);
                }
        }

        /**
         * Saves a FormResponse as a temporary submission
         * 
         * @param formResponse The FormResponse to save
         * @throws Exception if there's an error saving the form response
         */
        public static void saveTempFormResponse(FormResponse formResponse) throws Exception {
                if (formResponse == null) {
                        logger.error("Cannot save null form response to temporary collection");
                        throw new IllegalArgumentException("FormResponse cannot be null");
                }

                logger.debug("Saving temporary form response - formId: {}, eventId: {}, formResponseId: {}",
                                formResponse.getFormId(), formResponse.getEventId(),
                                formResponse.getFormResponseId());

                try {
                        Firestore db = FirebaseService.getFirestore();

                        String docPath = FirebaseService.CollectionPaths.TEMP_FORM_RESPONSE_PATH
                                        + "/" + formResponse.getFormId() + "/"
                                        + formResponse.getEventId() + "/"
                                        + formResponse.getFormResponseId();
                        logger.debug("Document path for temporary form response: {}", docPath);

                        DocumentReference docRef = db.document(docPath);
                        docRef.set(formResponse).get();

                        logger.info("Successfully saved temporary form response - formId: {}, eventId: {}, formResponseId: {}",
                                        formResponse.getFormId(), formResponse.getEventId(),
                                        formResponse.getFormResponseId());
                } catch (Exception e) {
                        logger.error("Error saving temporary form response - formId: {}, eventId: {}, formResponseId: {}",
                                        formResponse.getFormId(), formResponse.getEventId(),
                                        formResponse.getFormResponseId() != null
                                                        ? formResponse.getFormResponseId()
                                                        : "null",
                                        e);
                        throw new Exception("Could not save temporary form response - formId: "
                                        + formResponse.getFormId() + ", eventId: "
                                        + formResponse.getEventId() + ", formResponseId: "
                                        + formResponse.getFormResponseId(), e);
                }
        }
}
