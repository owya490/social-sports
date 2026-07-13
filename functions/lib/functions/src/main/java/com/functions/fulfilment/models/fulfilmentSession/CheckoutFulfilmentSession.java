package com.functions.fulfilment.models.fulfilmentSession;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;

@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
public class CheckoutFulfilmentSession extends FulfilmentSession {
    private Integer numTickets;
    private String eventTicketTypeId;
    private String eventTicketTypeName;

    {
        setType(FulfilmentSessionType.CHECKOUT);
    }
}
