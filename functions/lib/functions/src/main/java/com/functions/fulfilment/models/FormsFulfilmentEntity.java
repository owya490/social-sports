package com.functions.fulfilment.models;

import java.util.List;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@NoArgsConstructor
public class FormsFulfilmentEntity extends FulfilmentEntity {
    {
        setType(FulfilmentEntityType.FORMS);
    }
    private String formId;
    /**
     * List of non-committed form responses.
     */
    private List<String> formResponseIds;
    private List<String> submittedFormResponseIds;
}
