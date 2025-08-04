package com.functions.forms.models;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@NoArgsConstructor
public class DateTimeSection extends FormSection {
    private String timestamp; // uct time

    {
        setType(FormSectionType.DATE_TIME);
    }
}
