package com.functions.forms.repositories;

import com.functions.firebase.services.FirebaseService;
import com.functions.forms.models.FormResponse;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Transaction;
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
                try {
                        DocumentSnapshot formResponseSnapshot = findFormResponseDocumentSnapshot(
                                        formId, eventId, formResponseId, Optional.empty());
                        FormResponse formResponse =
                                        FormResponse.fromFirestore(formResponseSnapshot);

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
                Firestore db = FirebaseService.getFirestore();
                try {
                        for (String path : formResponsePaths.orElse(
                                        FirebaseService.CollectionPaths.FORM_RESPONSE_PATHS)) {
                                DocumentReference docRef = db.document(path + "/" + formId + "/"
                                                + eventId + "/" + formResponseId);
                                DocumentSnapshot maybeDocSnapshot = docRef.get().get();
                                if (maybeDocSnapshot.exists()) {
                                        logger.info("Found form response document - formId: {}, eventId: {}, formResponseId: {}, path: {}",
                                                        formId, eventId, formResponseId, path);
                                        return maybeDocSnapshot;
                                }
                        }
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
                        String formResponseId, Optional<Transaction> transaction) throws Exception {
                try {
                        Firestore db = FirebaseService.getFirestore();

                        if (transaction.isPresent()) {
                                String docPath = FirebaseService.CollectionPaths.TEMP_FORM_RESPONSE_PATH
                                                + "/" + formId + "/" + eventId + "/"
                                                + formResponseId;
                                DocumentReference docRef = db.document(docPath);
                                transaction.get().delete(docRef);
                        } else {
                                DocumentSnapshot formResponseSnapshot =
                                                findFormResponseDocumentSnapshot(formId, eventId,
                                                                formResponseId, Optional.of(List.of(
                                                                                FirebaseService.CollectionPaths.TEMP_FORM_RESPONSE_PATH)));
                                if (formResponseSnapshot.exists()) {
                                        DocumentReference docRef =
                                                        formResponseSnapshot.getReference();
                                        docRef.delete().get();
                                        logger.info("Deleted temporary form response - formId: {}, eventId: {}, formResponseId: {}",
                                                        formId, eventId, formResponseId);
                                } else {
                                        logger.warn("Form response not found for deletion - formId: {}, eventId: {}, formResponseId: {}",
                                                        formId, eventId, formResponseId);
                                }
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
         * Deletes a temporary form response (convenience method without transaction)
         */
        public static void deleteTempFormResponse(String formId, String eventId,
                        String formResponseId) throws Exception {
                deleteTempFormResponse(formId, eventId, formResponseId, Optional.empty());
        }

        /**
         * Retrieves a temporary FormResponse by ID
         *
         * @param formId The form ID
         * @param eventId The event ID
         * @param formResponseId The form response ID
         * @param transaction Optional transaction to use for the operation
         * @return Optional containing the FormResponse if found, empty otherwise
         */
        public static FormResponse getTempFormResponseById(String formId, String eventId,
                        String formResponseId, Optional<Transaction> transaction) throws Exception {
                try {
                        if (transaction.isPresent()) {
                                Firestore db = FirebaseService.getFirestore();
                                String docPath = FirebaseService.CollectionPaths.TEMP_FORM_RESPONSE_PATH
                                                + "/" + formId + "/" + eventId + "/"
                                                + formResponseId;
                                DocumentReference docRef = db.document(docPath);
                                DocumentSnapshot snapshot = transaction.get().get(docRef).get();

                                if (!snapshot.exists()) {
                                        throw new Exception("Temporary form response not found");
                                }

                                return FormResponse.fromFirestore(snapshot);
                        } else {
                                DocumentSnapshot formResponseSnapshot =
                                                findFormResponseDocumentSnapshot(formId, eventId,
                                                                formResponseId, Optional.of(List.of(
                                                                                FirebaseService.CollectionPaths.TEMP_FORM_RESPONSE_PATH)));
                                FormResponse formResponse =
                                                FormResponse.fromFirestore(formResponseSnapshot);
                                return formResponse;
                        }
                } catch (Exception e) {
                        logger.error("Error retrieving temporary form response by IDs - formId: {}, eventId: {}, formResponseId: {}",
                                        formId, eventId, formResponseId, e);
                        throw new Exception("Could not retrieve temporary form response - formId: "
                                        + formId + ", eventId: " + eventId + ", formResponseId: "
                                        + formResponseId, e);
                }
        }

        /**
         * Retrieves a temporary FormResponse by ID (convenience method without transaction)
         */
        public static FormResponse getTempFormResponseById(String formId, String eventId,
                        String formResponseId) throws Exception {
                return getTempFormResponseById(formId, eventId, formResponseId, Optional.empty());
        }

        /**
         * Saves a FormResponse to the submitted collection
         *
         * @param formResponse The FormResponse to save
         * @param transaction Optional transaction to use for the operation
         * @throws Exception if there's an error saving the form response
         */
        public static void saveSubmittedFormResponse(FormResponse formResponse,
                        Optional<Transaction> transaction) throws Exception {
                try {
                        Firestore db = FirebaseService.getFirestore();
                        String docPath = FirebaseService.CollectionPaths.SUBMITTED_FORM_RESPONSE_PATH
                                        + "/" + formResponse.getFormId() + "/"
                                        + formResponse.getEventId() + "/"
                                        + formResponse.getFormResponseId();
                        DocumentReference docRef = db.document(docPath);

                        if (transaction.isPresent()) {
                                transaction.get().set(docRef, formResponse);
                        } else {
                                docRef.set(formResponse).get();
                        }

                        logger.info("Saved submitted form response - formId: {}, eventId: {}, formResponseId: {}",
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
         * Saves a FormResponse to the submitted collection (convenience method without transaction)
         */
        public static void saveSubmittedFormResponse(FormResponse formResponse) throws Exception {
                saveSubmittedFormResponse(formResponse, Optional.empty());
        }

        /**
         * Saves a FormResponse as a temporary submission and returns the formResponseId
         *
         * @param formResponse The FormResponse to save
         * @return formResponseId
         * @throws Exception if there's an error saving the form response
         */
        public static void saveTempFormResponse(FormResponse formResponse) throws Exception {
                try {
                        Firestore db = FirebaseService.getFirestore();

                        String docPath = FirebaseService.CollectionPaths.TEMP_FORM_RESPONSE_PATH
                                        + "/" + formResponse.getFormId() + "/"
                                        + formResponse.getEventId() + "/"
                                        + formResponse.getFormResponseId();

                        DocumentReference docRef = db.document(docPath);
                        docRef.set(formResponse).get();

                        logger.info("Saved temporary form response - formId: {}, eventId: {}, formResponseId: {}",
                                        formResponse.getFormId(), formResponse.getEventId(),
                                        formResponse.getFormResponseId());
                } catch (Exception e) {
                        logger.error("Error saving temporary form response - formId: {}, eventId: {}",
                                        formResponse.getFormId(), formResponse.getEventId(), e);
                        throw new Exception("Could not save temporary form response - formId: "
                                        + formResponse.getFormId() + ", eventId: "
                                        + formResponse.getEventId(), e);
                }
        }

}
