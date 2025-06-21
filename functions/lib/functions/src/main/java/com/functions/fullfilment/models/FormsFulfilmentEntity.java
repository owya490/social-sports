package com.functions.fullfilment.models;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;

import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
public class FormsFulfilmentEntity extends FulfilmentEntity {
    private String formId;
    /**
     * List of non-committed form responses.
     */
    private List<String> formResponseIds;
    private List<String> submittedFormResponseIds;
}
