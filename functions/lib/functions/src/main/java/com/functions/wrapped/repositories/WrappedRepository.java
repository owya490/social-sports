package com.functions.wrapped.repositories;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.firebase.services.FirebaseService;
import com.functions.wrapped.models.SportshubWrappedData;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;

/**
 * Repository for storing and retrieving pre-calculated Wrapped data.
 * 
 * Firestore structure: /Wrapped/{userId}/{year}/SPORTSHUB_WRAPPED
 */
public class WrappedRepository {
    private static final Logger logger = LoggerFactory.getLogger(WrappedRepository.class);
    private static final String WRAPPED_ROOT_COLLECTION = "Wrapped";
    private static final String SPORTSHUB_WRAPPED_DOC = "SPORTSHUB_WRAPPED";

    /**
     * Gets the document reference for a wrapped data entry.
     * Path: /Wrapped/{organiserId}/{year}/SPORTSHUB_WRAPPED
     */
    private static DocumentReference getWrappedDocRef(String organiserId, int year) {
        Firestore db = FirebaseService.getFirestore();
        return db.collection(WRAPPED_ROOT_COLLECTION)
                .document(organiserId)
                .collection(String.valueOf(year))
                .document(SPORTSHUB_WRAPPED_DOC);
    }

    /**
     * Saves wrapped data to Firestore.
     *
     * @param organiserId The organiser's user ID
     * @param year The year for the wrapped data
     * @param wrappedData The wrapped data to save
     * @return The wrapped ID (document ID)
     */
    public static String saveWrappedData(String organiserId, int year, SportshubWrappedData wrappedData) throws Exception {
        try {
            DocumentReference docRef = getWrappedDocRef(organiserId, year);
            docRef.set(wrappedData).get();
            logger.info("Successfully saved wrapped data for organiserId: {}, year: {}", organiserId, year);
            return docRef.getId();
        } catch (Exception e) {
            logger.error("Failed to save wrapped data for organiserId: {}, year: {}", organiserId, year, e);
            throw new Exception("Failed to save wrapped data", e);
        }
    }

    /**
     * Retrieves wrapped data from Firestore.
     *
     * @param organiserId The organiser's user ID
     * @param year The year for the wrapped data
     * @return Optional containing the wrapped data if it exists
     */
    public static Optional<SportshubWrappedData> getWrappedData(String organiserId, int year) throws Exception {
        try {
            DocumentReference docRef = getWrappedDocRef(organiserId, year);
            DocumentSnapshot snapshot = docRef.get().get();
            
            if (snapshot.exists()) {
                SportshubWrappedData data = snapshot.toObject(SportshubWrappedData.class);
                logger.info("Successfully retrieved wrapped data for organiserId: {}, year: {}", organiserId, year);
                return Optional.ofNullable(data);
            }
            
            logger.info("No wrapped data found for organiserId: {}, year: {}", organiserId, year);
            return Optional.empty();
        } catch (Exception e) {
            logger.error("Failed to retrieve wrapped data for organiserId: {}, year: {}", organiserId, year, e);
            throw new Exception("Failed to retrieve wrapped data", e);
        }
    }
}

