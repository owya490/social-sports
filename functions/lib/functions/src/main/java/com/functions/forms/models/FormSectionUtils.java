package com.functions.forms.models;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Utility class for handling FormSection deserialization from Firebase.
 * Firebase doesn't support polymorphism directly, so we need custom
 * deserialization logic.
 */
public class FormSectionUtils {
    private static final Logger logger = LoggerFactory.getLogger(FormSectionUtils.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Deserialize a FormSection from Firebase data.
     * 
     * @param sectionData The raw section data from Firebase
     * @return The appropriate FormSection subclass
     * @throws Exception if deserialization fails
     */
    public static FormSection fromFirebaseData(Map<String, Object> sectionData) throws Exception {
        try {
            // Convert the map to JSON string, then deserialize using Jackson
            String json = objectMapper.writeValueAsString(sectionData);
            FormSectionType type = FormSectionType.valueOf((String) sectionData.get("type"));

            FormSection section;
            switch (type) {
                case TEXT:
                    section = objectMapper.readValue(json, TextSection.class);
                    break;
                case MULTIPLE_CHOICE:
                    section = objectMapper.readValue(json, MultipleChoiceSection.class);
                    break;
                case DROPDOWN_SELECT:
                    section = objectMapper.readValue(json, DropdownSelectSection.class);
                    break;
                case FILE_UPLOAD:
                    section = objectMapper.readValue(json, FileUploadSection.class);
                    break;
                case DATE_TIME:
                    section = objectMapper.readValue(json, DateTimeSection.class);
                    break;
                case BINARY_CHOICE:
                    // BINARY_CHOICE is handled the same as MULTIPLE_CHOICE
                    section = objectMapper.readValue(json, MultipleChoiceSection.class);
                    break;
                default:
                    throw new IllegalArgumentException("Unknown FormSection type: " + sectionData.get("type"));
            }

            return section;
        } catch (Exception e) {
            logger.error("Failed to deserialize FormSection: {}", sectionData, e);
            throw e;
        }
    }
}
