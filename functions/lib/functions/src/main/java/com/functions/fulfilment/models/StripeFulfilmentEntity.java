package com.functions.fulfilment.models;

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
    
    {
        setType(FulfilmentEntityType.STRIPE);
    }
}
