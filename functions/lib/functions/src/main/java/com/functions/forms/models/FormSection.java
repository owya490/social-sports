package com.functions.forms.models;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

/**
 * Abstract base class for form sections.
 * Store the type of FormSection for the purpose of deserialisation from
 * Firebase so we know
 * which concrete class to instantiate. Unfortunately, Firebase does not support
 * polymorphism directly.
 * NOTE: This should match the FormSection union type in FormTypes.ts
 */
@Data
@SuperBuilder
@NoArgsConstructor
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "type")
@JsonSubTypes({
        @JsonSubTypes.Type(value = TextSection.class, name = "TEXT"),
        @JsonSubTypes.Type(value = MultipleChoiceSection.class, name = "MULTIPLE_CHOICE"),
        @JsonSubTypes.Type(value = DropdownSelectSection.class, name = "DROPDOWN_SELECT"),
        @JsonSubTypes.Type(value = TickboxSection.class, name = "TICKBOX"),
        @JsonSubTypes.Type(value = FileUploadSection.class, name = "FILE_UPLOAD"),
        @JsonSubTypes.Type(value = DateTimeSection.class, name = "DATE_TIME"),
        @JsonSubTypes.Type(value = ImageSection.class, name = "IMAGE")
})
public abstract class FormSection {
    /**
     * Store the type of FormSection for the purpose of deserialisation from
     * Firebase so we know
     * which concrete class to instantiate. Unfortunately, Firebase does not support
     * polymorphism directly.
     */
    private FormSectionType type;
    private String question;
    private String imageUrl; // image attached to question, can be null
    private boolean required;
}
