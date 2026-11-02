package com.functions.fulfilment.models.fulfilmentEntities;

import java.util.Optional;
import java.util.function.Function;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.functions.fulfilment.models.fulfilmentSession.FulfilmentSession;
import com.functions.fulfilment.models.fulfilmentSession.PyngCheckoutFulfilmentSession;
import com.functions.fulfilment.models.fulfilmentSession.PyngMetadata;
import com.functions.fulfilment.payment.PaymentStatus;
import com.functions.fulfilment.pyng.PyngHostedCheckout;
import com.functions.fulfilment.pyng.PyngService;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@NoArgsConstructor
public class PyngFulfilmentEntity extends FulfilmentEntity {
    private static final Logger logger = LoggerFactory.getLogger(PyngFulfilmentEntity.class);
    private String url;

    {
        setType(FulfilmentEntityType.PYNG);
    }

    /**
     * Blocks progression until the hosted checkout has a terminal status.
     * Pending, missing metadata, and a non-Pyng session all return false.
     */
    @Override
    @JsonIgnore
    public Optional<Function<FulfilmentEntityHookInput, Boolean>> onEndHook() {
        return Optional.of(input -> {
            FulfilmentSession session = input.fulfilmentSession();
            if (!(session instanceof PyngCheckoutFulfilmentSession pyngSession)) {
                logger.error("Pyng payment step is not on a PYNG_CHECKOUT fulfilment session");
                return false;
            }
            PyngMetadata metadata = pyngSession.getPyngMetadata();
            if (metadata == null || metadata.getStatus() == null || !metadata.getStatus().isTerminal()) {
                logger.error("Pyng checkout is still pending for fulfilment entity {}", input.fulfilmentEntityId());
                return false;
            }
            return true;
        });
    }

    public void start(String fulfilmentSessionId, FulfilmentSession session, String fulfilmentEntityId)
            throws Exception {
        PyngCheckoutFulfilmentSession pyngSession = requirePyngCheckout(session);
        PyngMetadata existing = pyngSession.getPyngMetadata();
        if (existing != null && existing.getCheckoutSessionId() != null && !existing.getCheckoutSessionId().isBlank()) {
            logger.info("Pyng checkout already started for fulfilment session {}", fulfilmentSessionId);
            return;
        }

        PyngHostedCheckout checkout = PyngService.createHostedCheckout(pyngSession);
        // The buyer stays on this fulfilment page. Hosted checkout opens in another tab.
        setUrl("/fulfilment/" + fulfilmentSessionId + "/" + fulfilmentEntityId);
        PyngMetadata metadata = PyngMetadata.builder()
                .checkoutSessionId(checkout.checkoutSessionId())
                .hostedPageUrl(checkout.hostedPageUrl())
                .siteId(checkout.siteId())
                .status(PaymentStatus.PENDING)
                .build();
        pyngSession.setPyngMetadata(metadata);
        logger.info("Started Pyng checkout for fulfilment session {}", fulfilmentSessionId);
    }

    private static PyngCheckoutFulfilmentSession requirePyngCheckout(FulfilmentSession session) {
        if (!(session instanceof PyngCheckoutFulfilmentSession pyngSession)) {
            throw new IllegalArgumentException("Pyng payment step requires a PYNG_CHECKOUT fulfilment session");
        }
        return pyngSession;
    }
}
