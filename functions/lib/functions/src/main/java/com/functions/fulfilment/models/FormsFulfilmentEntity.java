package com.functions.fulfilment.models;

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
    private String formResponseId;
}
