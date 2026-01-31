package com.functions.fulfilment.models.fulfilmentEntities;

import lombok.Getter;

@Getter
public enum FulfilmentEntityType {
    STRIPE,
    DELAYED_STRIPE,
    FORMS,
    WAITLIST,
    END;
}
