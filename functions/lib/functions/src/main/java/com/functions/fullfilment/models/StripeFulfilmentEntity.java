package com.functions.fullfilment.models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.SuperBuilder;

@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
public class StripeFulfilmentEntity extends FulfilmentEntity {
    private String stripeCheckoutLink;
}
