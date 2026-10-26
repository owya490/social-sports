package com.functions.fulfilment.models.fulfilmentEntities;

import java.util.Optional;
import java.util.function.Function;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.functions.fulfilment.models.PurchaserDetails;
import com.functions.fulfilment.models.fulfilmentSession.FulfilmentSession;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@NoArgsConstructor
public class DetailsFulfilmentEntity extends FulfilmentEntity {
    private static final Logger logger = LoggerFactory.getLogger(DetailsFulfilmentEntity.class);

    {
        setType(FulfilmentEntityType.DETAILS);
    }

    /**
     * Pyng checkout needs a purchaser. The name and email live on the session,
     * and this step cannot advance until both are present.
     */
    @Override
    @JsonIgnore
    public Optional<Function<FulfilmentEntityHookInput, Boolean>> onEndHook() {
        return Optional.of(input -> {
            FulfilmentSession session = input.fulfilmentSession();
            if (!PurchaserDetails.isValid(session.getPurchaserName(), session.getPurchaserEmail())) {
                logger.error("Purchaser name or email is missing for fulfilment entity {}", input.fulfilmentEntityId());
                return false;
            }
            return true;
        });
    }
}
