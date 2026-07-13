package com.functions.fulfilment.models.fulfilmentSession;

import javax.annotation.Nullable;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;

@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
public class CheckoutFulfilmentSession extends FulfilmentSession {
    private Integer numTickets;
    @Nullable
    private String eventTicketTypeId;
    @Nullable
    private String eventTicketTypeName;

    {
        setType(FulfilmentSessionType.CHECKOUT);
    }
}
