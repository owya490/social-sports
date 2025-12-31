package com.functions.fulfilment.models.fulfilmentSession;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;

@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
public class BookingApprovalFulfilmentSession extends FulfilmentSession {
    private Integer numTickets;

    {
        setType(FulfilmentSessionType.BOOKING_APPROVAL);
    }
}
