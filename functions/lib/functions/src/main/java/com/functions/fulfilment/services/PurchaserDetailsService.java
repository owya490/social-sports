package com.functions.fulfilment.services;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.fulfilment.exceptions.FulfilmentEntityNotFoundException;
import com.functions.fulfilment.exceptions.FulfilmentSessionNotFoundException;
import com.functions.fulfilment.models.PurchaserDetails;
import com.functions.fulfilment.models.fulfilmentEntities.DetailsFulfilmentEntity;
import com.functions.fulfilment.models.fulfilmentEntities.FulfilmentEntity;
import com.functions.fulfilment.models.fulfilmentSession.FulfilmentSession;
import com.functions.fulfilment.repositories.FulfilmentSessionRepository;

public final class PurchaserDetailsService {
    private static final Logger logger = LoggerFactory.getLogger(PurchaserDetailsService.class);

    private PurchaserDetailsService() {
    }

    public static void save(String fulfilmentSessionId, String fulfilmentEntityId, String name, String email)
            throws Exception {
        String purchaserName = PurchaserDetails.normaliseName(name);
        String purchaserEmail = PurchaserDetails.normaliseEmail(email);
        if (!PurchaserDetails.isValid(purchaserName, purchaserEmail)) {
            throw new IllegalArgumentException("A purchaser name and valid email are required");
        }

        Optional<FulfilmentSession> maybeSession = FulfilmentSessionRepository.getFulfilmentSession(
                fulfilmentSessionId, Optional.empty());
        if (maybeSession.isEmpty()) {
            throw new FulfilmentSessionNotFoundException(fulfilmentSessionId);
        }
        FulfilmentEntity entity = maybeSession.get().getFulfilmentEntityMap().get(fulfilmentEntityId);
        if (!(entity instanceof DetailsFulfilmentEntity)) {
            throw new FulfilmentEntityNotFoundException(fulfilmentEntityId);
        }

        FulfilmentSessionRepository.updatePurchaser(fulfilmentSessionId, purchaserName, purchaserEmail);
        logger.info("Saved purchaser details for fulfilment session {}", fulfilmentSessionId);
    }
}
