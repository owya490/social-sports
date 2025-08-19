package com.functions.fulfilment.models;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@NoArgsConstructor
public abstract class FulfilmentEntity {
    /**
     * Store the type of FulfilmentEntity for the purpose of deserialisation from Firebase so we know
     * which concrete class to instantiate. Unfortunately, Firebase does not support polymorphism directly.
     */
    private FulfilmentEntityType type;
}
