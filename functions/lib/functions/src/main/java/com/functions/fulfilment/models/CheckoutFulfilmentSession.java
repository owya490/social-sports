package com.functions.fulfilment.models;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;

@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
public class CheckoutFulfilmentSession extends FulfilmentSession {
    private Integer numTickets;

    {
        setType(FulfilmentSessionType.CHECKOUT);
    }
}
