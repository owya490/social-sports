package com.functions.fulfilment.models.fulfilmentEntities;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@NoArgsConstructor
public class WaitlistFulfilmentEntity extends FulfilmentEntity {
    {
        setType(FulfilmentEntityType.WAITLIST);
    }
    private String eventId;
    private Integer ticketCount;
}
