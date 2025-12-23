package com.functions.fulfilment.models.fulfilmentEntities;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@NoArgsConstructor
public class EndFulfilmentEntity extends  FulfilmentEntity {
    private String url;
    
    {
        setType(FulfilmentEntityType.END);
    }
}
