package com.functions.fulfilment.pyng;

import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.fulfilment.models.PurchaserDetails;
import com.functions.fulfilment.models.fulfilmentSession.FulfilmentSession;
import com.functions.fulfilment.models.fulfilmentSession.FulfilmentSessionStatus;
import com.functions.fulfilment.models.fulfilmentSession.PyngCheckoutFulfilmentSession;
import com.functions.fulfilment.models.fulfilmentSession.PyngMetadata;
import com.functions.fulfilment.payment.PaymentStatus;
import com.functions.fulfilment.repositories.FulfilmentSessionRepository;
import com.functions.fulfilment.services.FulfilmentSessionPublisher;

/**
 * Pyng payment completion. A pending hosted checkout is polled from the
 * fulfilment page and from the minute cron. A terminal outcome is published
 * as the whole fulfilment session, then recorded so it is not published again.
 */
public final class PyngCheckoutCompletion {
    private static final Logger logger = LoggerFactory.getLogger(PyngCheckoutCompletion.class);

    @FunctionalInterface
    interface SessionSource {
        FulfilmentSession load(String sessionId) throws Exception;
    }

    @FunctionalInterface
    interface SettlementStore {
        void save(String sessionId, PyngMetadata metadata, FulfilmentSessionStatus status) throws Exception;
    }

    static volatile SessionSource sessions = PyngCheckoutCompletion::loadStoredSession;
    static volatile SettlementStore settlements = FulfilmentSessionRepository::updatePyngSettlement;

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
                refresh(sessionId);
            } catch (Exception e) {
                logger.error("Failed to poll Pyng checkout for fulfilment session {}", sessionId, e);
            }
        }
    }

    public static PaymentStatus refresh(String sessionId) throws Exception {
        FulfilmentSession loaded = sessions.load(sessionId);
        if (!(loaded instanceof PyngCheckoutFulfilmentSession session)) {
            throw new IllegalArgumentException("Fulfilment session " + sessionId + " is not a Pyng checkout");
        }
        PyngMetadata metadata = session.getPyngMetadata();
        if (metadata == null || metadata.getStatus() == null) {
            throw new IllegalStateException("Pyng checkout has not started for fulfilment session " + sessionId);
        }
        if (Boolean.TRUE.equals(session.getIsFulfilmentSessionCrystalised())) {
            return metadata.getStatus();
        }
        if (metadata.getStatus().isTerminal()) {
            return settle(sessionId, session, metadata, metadata.getStatus());
        }

        PaymentStatus observed = PyngService.pollCheckout(metadata);
        logger.info("Polled Pyng checkout for fulfilment session {} and observed status {}", sessionId, observed);
        if (observed == null || !observed.isTerminal()) {
            return PaymentStatus.PENDING;
        }
        return settle(sessionId, session, metadata, observed);
    }

    private static PaymentStatus settle(String sessionId, PyngCheckoutFulfilmentSession session,
            PyngMetadata metadata, PaymentStatus observed) throws Exception {
        FulfilmentSessionStatus sessionStatus;
        if (observed == PaymentStatus.SUCCEEDED) {
            if (!PurchaserDetails.isValid(session.getPurchaserName(), session.getPurchaserEmail())) {
                throw new IllegalStateException(
                        "Pyng checkout settled without a purchaser name and email for session " + sessionId);
            }
            sessionStatus = FulfilmentSessionStatus.COMPLETED;
        } else if (observed == PaymentStatus.EXPIRED || observed == PaymentStatus.CANCELLED) {
            sessionStatus = FulfilmentSessionStatus.EXPIRED;
        } else {
            return observed;
        }

        metadata.setStatus(observed);
        session.setPyngMetadata(metadata);
        session.setStatus(sessionStatus);
        session.setIsFulfilmentSessionCrystalised(true);
        FulfilmentSessionPublisher.publish(session);
        settlements.save(sessionId, metadata, sessionStatus);
        logger.info("Published Pyng fulfilment session {} with payment status {}", sessionId, observed);
        return observed;
    }

    private static FulfilmentSession loadStoredSession(String sessionId) throws Exception {
        Optional<FulfilmentSession> maybeSession = FulfilmentSessionRepository.getFulfilmentSession(sessionId,
                Optional.empty());
        if (maybeSession.isEmpty()) {
            throw new IllegalArgumentException("Fulfilment session " + sessionId + " was not found");
        }
        return maybeSession.get();
    }

    static void reset() {
        sessions = PyngCheckoutCompletion::loadStoredSession;
        settlements = FulfilmentSessionRepository::updatePyngSettlement;
    }
}
