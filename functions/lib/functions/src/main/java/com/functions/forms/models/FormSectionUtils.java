package com.functions.forms.models;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

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
            FormSectionType type = FormSectionType.valueOf((String) sectionData.get("type"));

            FormSection section;
            switch (type) {
                case TEXT:
                    section = objectMapper.convertValue(sectionData, TextSection.class);
                    break;
                case MULTIPLE_CHOICE:
                    section = objectMapper.convertValue(sectionData, MultipleChoiceSection.class);
                    break;
                case DROPDOWN_SELECT:
                    section = objectMapper.convertValue(sectionData, DropdownSelectSection.class);
                    break;
                case FILE_UPLOAD:
                    section = objectMapper.convertValue(sectionData, FileUploadSection.class);
                    break;
                case DATE_TIME:
                    section = objectMapper.convertValue(sectionData, DateTimeSection.class);
                    break;
                case BINARY_CHOICE:
                    // BINARY_CHOICE is handled the same as MULTIPLE_CHOICE
                    section = objectMapper.convertValue(sectionData, MultipleChoiceSection.class);
                    break;
                case IMAGE:
                    section = objectMapper.convertValue(sectionData, ImageSection.class);
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
