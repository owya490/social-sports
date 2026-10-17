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

    {
        setType(FulfilmentSessionType.PYNG_CHECKOUT);
    }
}
