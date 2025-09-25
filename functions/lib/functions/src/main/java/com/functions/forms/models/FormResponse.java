package com.functions.forms.models;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.functions.utils.JavaUtils;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentSnapshot;

import lombok.Data;

/**
 * Contains the answers of the form from the responder
 * NOTE: This type should match the FormResponse interface in FormTypes.ts
 */
@Data
public class FormResponse {
    private static final Logger logger = LoggerFactory.getLogger(FormResponse.class);

    private String formId;
    private String eventId;
    private String formResponseId;
    private List<String> responseSectionsOrder;
    private Map<String, FormSection> responseMap;

    /** timestamp in uct; is null when stored as temp form submission */
    @JsonSerialize(using = JavaUtils.TimestampSerializer.class)
    @JsonDeserialize(using = JavaUtils.TimestampDeserializer.class)
    private Timestamp submissionTime;

    /**
     * Custom deserialization from Firebase DocumentSnapshot.
     * Firestore deserialization can't take advantage of java polymorphism - when
     * deserializing
     * a map of abstract FormSection class, it will not know which concrete class to
     * instantiate.
     */
    public static FormResponse fromFirestore(DocumentSnapshot snapshot) {
        FormResponse formResponse = new FormResponse();

        // Set basic fields
        formResponse.setFormId((String) snapshot.get("formId"));
        formResponse.setEventId((String) snapshot.get("eventId"));
        formResponse.setFormResponseId((String) snapshot.get("formResponseId"));

        @SuppressWarnings("unchecked")
        List<String> sectionsOrder = (List<String>) snapshot.get("responseSectionsOrder");
        formResponse.setResponseSectionsOrder(sectionsOrder);

        // Handle the responseMap with custom deserialization
        @SuppressWarnings("unchecked")
        Map<String, Object> rawResponseMap = (Map<String, Object>) snapshot.get("responseMap");
        Map<String, FormSection> responseMap = new HashMap<>();

        if (rawResponseMap != null) {
            for (Map.Entry<String, Object> entry : rawResponseMap.entrySet()) {
                String sectionId = entry.getKey();
                @SuppressWarnings("unchecked")
                Map<String, Object> sectionData = (Map<String, Object>) entry.getValue();

                try {
                    FormSection section = FormSectionUtils.fromFirebaseData(sectionData);
                    responseMap.put(sectionId, section);
                } catch (Exception e) {
                    logger.error("Failed to deserialize FormSection for sectionId {}: {}", sectionId, sectionData, e);
                }
            }
        }

        formResponse.setResponseMap(responseMap);

        // Handle timestamp
        com.google.cloud.Timestamp firestoreTimestamp = snapshot.getTimestamp("submissionTime");
        formResponse.setSubmissionTime(firestoreTimestamp);

        return formResponse;
    }
}
