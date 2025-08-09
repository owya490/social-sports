package com.functions.forms.models;

import java.util.List;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@NoArgsConstructor
public class DropdownSelectSection extends FormSection {
    private List<String> options;
    private String answer; // value of chosen option

    {
        setType(FormSectionType.DROPDOWN_SELECT);
    }
}
