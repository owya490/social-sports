package com.functions.fulfilment.models;

import lombok.Getter;

@Getter
public enum FulfilmentEntityType {
    START,
    STRIPE,
    FORMS,
    END;
}
