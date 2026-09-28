package com.functions.fulfilment.models.fulfilmentEntities;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.fulfilment.models.fulfilmentSession.FulfilmentSession;
import com.functions.fulfilment.models.fulfilmentSession.PyngCheckoutFulfilmentSession;
import com.functions.fulfilment.models.fulfilmentSession.PyngMetadata;
import com.functions.fulfilment.payment.PaymentFulfilmentStep;
import com.functions.fulfilment.payment.PaymentStatus;
import com.functions.fulfilment.pyng.PyngHostedCheckout;
import com.functions.fulfilment.pyng.PyngService;
import com.functions.fulfilment.repositories.FulfilmentSessionRepository;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@NoArgsConstructor
public class PyngFulfilmentEntity extends FulfilmentEntity implements PaymentFulfilmentStep {
    private static final Logger logger = LoggerFactory.getLogger(PyngFulfilmentEntity.class);

    {
        setType(FulfilmentEntityType.PYNG);
    }

    @Override
    public void start(String fulfilmentSessionId, FulfilmentSession session, String fulfilmentEntityId)
            throws Exception {
        PyngCheckoutFulfilmentSession pyngSession = requirePyngCheckout(session);
        PyngMetadata existing = pyngSession.getPyngMetadata();
        if (existing != null && existing.getCheckoutSessionId() != null && !existing.getCheckoutSessionId().isBlank()) {
            logger.info("Pyng checkout already started for fulfilment session {}", fulfilmentSessionId);
            return;
        }

        PyngHostedCheckout checkout = PyngService.createHostedCheckout(pyngSession);
        PyngMetadata metadata = PyngMetadata.builder()
                .checkoutSessionId(checkout.checkoutSessionId())
                .hostedPageUrl(checkout.hostedPageUrl())
                .status(PaymentStatus.PENDING)
                .build();
        pyngSession.setPyngMetadata(metadata);
        FulfilmentSessionRepository.updatePyngMetadata(fulfilmentSessionId, metadata);
        logger.info("Started Pyng checkout for fulfilment session {}", fulfilmentSessionId);
    }

    private static PyngCheckoutFulfilmentSession requirePyngCheckout(FulfilmentSession session) {
        if (!(session instanceof PyngCheckoutFulfilmentSession pyngSession)) {
            throw new IllegalArgumentException("Pyng payment step requires a PYNG_CHECKOUT fulfilment session");
        }
        return pyngSession;
    }
}
