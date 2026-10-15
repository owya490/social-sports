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
import com.functions.fulfilment.services.FulfilmentService;

/**
 * Pyng payment completion. When the hosted checkout is finished, this records
 * the outcome and resumes the fulfilment session workflow.
 */
public final class PyngCheckoutCompletion {
    private static final Logger logger = LoggerFactory.getLogger(PyngCheckoutCompletion.class);

    private PyngCheckoutCompletion() {
    }

    public record PollPendingPyngCheckoutsResult(int checked, int resumed, int errors) {
    }

    /**
     * Reloads every uncrystallized Pyng checkout from Firestore and polls Pyng.
     * State lives on the session document, so a restarted function continues on
     * the next cron run.
     */
    public static PollPendingPyngCheckoutsResult pollPendingCheckouts() throws Exception {
        List<String> sessionIds = FulfilmentSessionRepository.listUncrystallizedSessionIds();
        int checked = 0;
        int resumed = 0;
        int errors = 0;
        for (String sessionId : sessionIds) {
            try {
                Optional<FulfilmentSession> maybeSession = FulfilmentSessionRepository.getFulfilmentSession(sessionId,
                        Optional.empty());
                if (maybeSession.isEmpty() || !(maybeSession.get() instanceof PyngCheckoutFulfilmentSession session)) {
                    continue;
                }
                PyngMetadata metadata = session.getPyngMetadata();
                if (metadata == null || metadata.getStatus() == null) {
                    continue;
                }
                refresh(sessionId, session);
                checked++;
                if (Boolean.TRUE.equals(session.getCrystallized())) {
                    resumed++;
                }
            } catch (Exception e) {
                errors++;
                logger.error("Failed to poll Pyng checkout for fulfilment session {}", sessionId, e);
            }
        }
        logger.info("Pyng checkout poll pass finished. checked={}, resumed={}, errors={}",
                checked, resumed, errors);
        return new PollPendingPyngCheckoutsResult(checked, resumed, errors);
    }

    public static void refresh(String fulfilmentSessionId, PyngCheckoutFulfilmentSession session) throws Exception {
        PyngMetadata metadata = session.getPyngMetadata();
        if (metadata == null || metadata.getStatus() == null) {
            return;
        }
        if (!metadata.getStatus().isTerminal()) {
            PaymentStatus observed = PyngService.pollCheckout(metadata);
            if (observed == null || !observed.isTerminal()) {
                return;
            }
            if (!recordTerminalStatus(fulfilmentSessionId, session, metadata, observed)) {
                return;
            }
        }
        FulfilmentService.resumeAfterPayment(fulfilmentSessionId, session);
    }

    private static boolean recordTerminalStatus(String fulfilmentSessionId, PyngCheckoutFulfilmentSession session,
            PyngMetadata metadata, PaymentStatus status) throws Exception {
        PaymentStatus current = metadata.getStatus();
        if (current == status) {
            return true;
        }
        if (current != null && current.isTerminal()) {
            logger.error("Refusing to change Pyng payment status from {} to {} for session {}",
                    current, status, fulfilmentSessionId);
            return false;
        }

        metadata.setStatus(status);
        session.setPyngMetadata(metadata);
        FulfilmentSessionRepository.updatePyngMetadata(fulfilmentSessionId, metadata);
        logger.info("Pyng checkout finished for fulfilment session {} with status {}", fulfilmentSessionId, status);
        return true;
    }
}
