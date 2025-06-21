package com.functions.fulfilment.models;

import lombok.Data;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
public abstract class FulfilmentEntity {
    private String nextUrl;
}
