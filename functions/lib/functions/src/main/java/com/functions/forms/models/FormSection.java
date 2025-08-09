package com.functions.forms.models;

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
