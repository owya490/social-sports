package com.functions.forms.models;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@NoArgsConstructor
public class TextSection extends FormSection {
    private String answer;

    {
        setType(FormSectionType.TEXT);
    }
}
