package com.functions.fulfilment.models;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
@NoArgsConstructor
public abstract class FulfilmentEntity {
    private String nextUrl;
}
