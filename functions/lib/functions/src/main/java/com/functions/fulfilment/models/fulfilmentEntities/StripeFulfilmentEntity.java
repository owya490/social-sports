package com.functions.fulfilment.models.fulfilmentEntities;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@NoArgsConstructor
public class StripeFulfilmentEntity extends FulfilmentEntity {
    private String url;
    /** Stripe Checkout Session id (cs_...), for manual expiry via cron. */
    private String stripeCheckoutSessionId;
    /** Connected account id used when creating the session (Session.expire requires it). */
    private String stripeAccountId;

    {
        setType(FulfilmentEntityType.STRIPE);
    }
}
