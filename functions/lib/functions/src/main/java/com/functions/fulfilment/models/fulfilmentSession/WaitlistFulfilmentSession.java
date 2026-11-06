package com.functions.fulfilment.models.fulfilmentSession;

import javax.annotation.Nullable;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;

@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
public class WaitlistFulfilmentSession extends FulfilmentSession {
    private Integer numTickets;
    private String eventTicketTypeId;
    @Nullable
    private Integer price;

    {
        setType(FulfilmentSessionType.WAITLIST);
    }
}
