package com.functions.fulfilment.models.fulfilmentSession;

import javax.annotation.Nullable;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;

@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
public class PyngCheckoutFulfilmentSession extends FulfilmentSession {
    private Integer numTickets;
    @Nullable
    private String eventTicketTypeId;
    @Nullable
    private String eventTicketTypeName;
    @Nullable
    private PyngMetadata pyngMetadata;
    /**
     * Set once the session object has been handed to the reconciliation queue.
     */
    @Nullable
    private Boolean crystallized;

    {
        setType(FulfilmentSessionType.PYNG_CHECKOUT);
    }
}
