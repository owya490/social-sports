package com.functions.fullfilment.models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
public abstract class FulfilmentEntity {
    private String nextUrl;
}
