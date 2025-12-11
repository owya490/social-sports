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
public class TickboxSection extends FormSection {
    private List<String> options;
    private List<String> answer; // value of chosen options

    {
        setType(FormSectionType.TICKBOX);
    }

    public boolean hasAnswer() {
        return answer != null && !answer.isEmpty();
    }
}

