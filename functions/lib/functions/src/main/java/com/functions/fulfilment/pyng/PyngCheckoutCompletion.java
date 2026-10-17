package com.functions.fulfilment.pyng;

import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.fulfilment.models.fulfilmentSession.FulfilmentSession;
import com.functions.fulfilment.models.fulfilmentSession.PyngCheckoutFulfilmentSession;
import com.functions.fulfilment.models.fulfilmentSession.PyngMetadata;
import com.functions.fulfilment.payment.PaymentStatus;
import com.functions.fulfilment.repositories.FulfilmentSessionRepository;

/**
 * Pyng payment completion. When a pending hosted checkout is finished, this
 * records the outcome on the fulfilment session.
 */
public final class PyngCheckoutCompletion {
    private static final Logger logger = LoggerFactory.getLogger(PyngCheckoutCompletion.class);

    private PyngCheckoutCompletion() {
    }

    /**
     * Polls Pyng for every PYNG_CHECKOUT session whose payment status is still
     * PENDING. State lives on the session document, so a restarted function
     * continues on the next cron run.
     */
    public static void pollPendingCheckouts() throws Exception {
        List<String> sessionIds = FulfilmentSessionRepository.listPendingPyngCheckoutSessionIds();
        for (String sessionId : sessionIds) {
            try {
                pollSession(sessionId);
            } catch (Exception e) {
                logger.error("Failed to poll Pyng checkout for fulfilment session {}", sessionId, e);
            }
        }
    }

    private static void pollSession(String sessionId) throws Exception {
        Optional<FulfilmentSession> maybeSession = FulfilmentSessionRepository.getFulfilmentSession(sessionId,
                Optional.empty());
        if (maybeSession.isEmpty() || !(maybeSession.get() instanceof PyngCheckoutFulfilmentSession session)) {
            logger.info("Skipping fulfilment session {} because it is not a Pyng checkout", sessionId);
            return;
        }
        PyngMetadata metadata = session.getPyngMetadata();
        if (metadata == null || metadata.getStatus() != PaymentStatus.PENDING) {
            logger.info("Skipping fulfilment session {} because its Pyng status is {}", sessionId,
                    metadata == null ? null : metadata.getStatus());
            return;
        }

        PaymentStatus observed = PyngService.pollCheckout(metadata);
        logger.info("Polled Pyng checkout for fulfilment session {} and observed status {}", sessionId, observed);
        if (observed == null || !observed.isTerminal()) {
            return;
        }
        recordTerminalStatus(sessionId, session, metadata, observed);
    }

    private static void recordTerminalStatus(String fulfilmentSessionId, PyngCheckoutFulfilmentSession session,
            PyngMetadata metadata, PaymentStatus status) throws Exception {
        PaymentStatus current = metadata.getStatus();
        if (current == status) {
            return;
        }
        if (current != null && current.isTerminal()) {
            logger.error("Refusing to change Pyng payment status from {} to {} for session {}",
                    current, status, fulfilmentSessionId);
            return;
        }

        metadata.setStatus(status);
        session.setPyngMetadata(metadata);
        FulfilmentSessionRepository.updatePyngMetadata(fulfilmentSessionId, metadata);
    }
}
