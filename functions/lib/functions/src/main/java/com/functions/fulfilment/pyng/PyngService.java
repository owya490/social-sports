package com.functions.fulfilment.pyng;

import java.io.IOException;
import java.net.URI;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.events.models.ResolvedEventTicketType;
import com.functions.events.services.EventTicketTypeService;
import com.functions.fulfilment.models.fulfilmentEntities.FulfilmentEntity;
import com.functions.fulfilment.models.fulfilmentEntities.FulfilmentEntityType;
import com.functions.fulfilment.models.fulfilmentSession.PyngCheckoutFulfilmentSession;
import com.functions.fulfilment.models.fulfilmentSession.PyngMetadata;
import com.functions.fulfilment.payment.PaymentStatus;
import com.functions.fulfilment.repositories.FulfilmentSessionRepository;
import com.functions.fulfilment.services.FulfilmentService;
import com.functions.utils.JavaUtils;

/**
 * Pyng hosted checkout. Creates a Checkout Session, reads its status, and
 * continues the fulfilment session once payment has settled or did not complete.
 */
public final class PyngService {
    private static final Logger logger = LoggerFactory.getLogger(PyngService.class);
    private static final Pattern METADATA_KEY = Pattern.compile("[A-Za-z0-9_-]{1,40}");
    private static final int MAX_METADATA_KEYS = 20;
    private static final int MAX_METADATA_VALUE_CHARS = 500;
    private static final int MAX_METADATA_BYTES = 4096;
    private static final int MAX_RETURN_URL_LENGTH = 2048;

    // Replaced in tests so checkout calls do not hit Pyng or Firestore.
    static volatile PyngCheckoutClient client = PyngCheckoutClient.http();
    static volatile Continuation continuation;
    static volatile StatusRecorder statusRecorder;

    @FunctionalInterface
    interface Continuation {
        void resume(String fulfilmentSessionId, PyngCheckoutFulfilmentSession session) throws Exception;
    }

    @FunctionalInterface
    interface StatusRecorder {
        void save(String fulfilmentSessionId, PyngMetadata metadata) throws Exception;
    }

    private PyngService() {
    }

    public static PyngHostedCheckout createHostedCheckout(PyngCheckoutFulfilmentSession session) {
        if (session == null) {
            throw new IllegalArgumentException("Pyng checkout session is required");
        }
        String orderId = orderId(session);
        // Same id on retry returns the original session when the body matches.
        // A different body for this id is rejected by Pyng with 409.
        String requestId = orderId;
        try {
            return client.createSession(new PyngCheckoutClient.CreateCheckoutSession(
                    requestId,
                    orderId,
                    checkoutAmountCents(session),
                    returnUrl(session),
                    metadata(session)));
        } catch (IOException e) {
            throw new IllegalStateException("Failed to create Pyng checkout session for order " + orderId, e);
        }
    }

    public static PaymentStatus pollCheckout(PyngMetadata metadata) {
        if (metadata == null || metadata.getCheckoutSessionId() == null
                || metadata.getCheckoutSessionId().isBlank()) {
            throw new IllegalArgumentException("Pyng checkout session id is required to poll status");
        }
        try {
            return client.getStatus(metadata.getCheckoutSessionId());
        } catch (IOException e) {
            throw new IllegalStateException(
                    "Failed to read Pyng checkout session " + metadata.getCheckoutSessionId(), e);
        }
    }

    /**
     * Polls Pyng while the checkout is open. A settled payment and a checkout
     * that did not complete (declined or expired) are stored, then fulfilment
     * continues. Pending and in-progress checkouts wait for a later poll.
     */
    public static void refreshCheckout(String fulfilmentSessionId, PyngCheckoutFulfilmentSession session)
            throws Exception {
        PyngMetadata metadata = session.getPyngMetadata();
        if (metadata == null || metadata.getStatus() == null) {
            return;
        }
        if (!metadata.getStatus().isTerminal()) {
            PaymentStatus observed = pollCheckout(metadata);
            if (observed == null || !observed.isTerminal()) {
                return;
            }
            if (!recordTerminalStatus(fulfilmentSessionId, session, metadata, observed)) {
                return;
            }
        }
        continueFulfilment(fulfilmentSessionId, session);
    }

    /**
     * Continues the fulfilment session when Pyng has finished the checkout.
     * Settled payments and incomplete outcomes both continue. An in-progress
     * checkout does not.
     */
    public static void continueFulfilment(String fulfilmentSessionId, PyngCheckoutFulfilmentSession session)
            throws Exception {
        PyngMetadata metadata = session == null ? null : session.getPyngMetadata();
        PaymentStatus status = metadata == null ? null : metadata.getStatus();
        if (status == null || !status.isTerminal()) {
            logger.info("Pyng payment for fulfilment session {} is not finished; leaving the checkout in progress",
                    fulfilmentSessionId);
            return;
        }
        logger.info("Pyng payment for fulfilment session {} finished with status {}; continuing fulfilment",
                fulfilmentSessionId, status);
        Continuation resume = continuation;
        if (resume == null) {
            resume = FulfilmentService::resumeAfterPayment;
        }
        resume.resume(fulfilmentSessionId, session);
    }

    /**
     * Checks the return-redirect signature. The redirect is not the payment
     * outcome. When the site has no signing secret the signature is ignored.
     * Inputs may still be URL-encoded.
     */
    public static boolean verifyReturnSignature(String checkoutSessionId, String transactionStatus, String signature) {
        String secret = PyngConfig.returnRedirectSecret();
        if (secret == null) {
            return true;
        }
        if (checkoutSessionId == null || transactionStatus == null || signature == null || signature.isBlank()) {
            return false;
        }
        String expected = PyngReturnSignature.sign(
                secret, urlDecode(checkoutSessionId), urlDecode(transactionStatus));
        return PyngReturnSignature.matches(expected, urlDecode(signature));
    }

    static PaymentStatus mapTransactionStatus(String transactionStatus) {
        if (transactionStatus == null) {
            throw new IllegalStateException("Pyng transactionStatus is missing");
        }
        return switch (transactionStatus) {
            case "Pending", "InProgress" -> PaymentStatus.PENDING;
            case "Settled" -> PaymentStatus.SUCCEEDED;
            case "Declined" -> PaymentStatus.CANCELLED;
            case "Expired" -> PaymentStatus.EXPIRED;
            default -> throw new IllegalStateException("Unknown Pyng transactionStatus: " + transactionStatus);
        };
    }

    static void validateMetadata(Map<String, String> metadata) {
        if (metadata == null || metadata.isEmpty()) {
            return;
        }
        if (metadata.size() > MAX_METADATA_KEYS) {
            throw new IllegalArgumentException("Pyng metadata supports at most " + MAX_METADATA_KEYS + " keys");
        }
        for (Map.Entry<String, String> entry : metadata.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();
            if (key == null || !METADATA_KEY.matcher(key).matches()) {
                throw new IllegalArgumentException("Pyng metadata key is not 1-40 characters of [A-Za-z0-9_-]: " + key);
            }
            if (value == null) {
                throw new IllegalArgumentException("Pyng metadata values must be strings");
            }
            if (value.codePointCount(0, value.length()) > MAX_METADATA_VALUE_CHARS) {
                throw new IllegalArgumentException("Pyng metadata value for " + key + " exceeds 500 characters");
            }
        }
        try {
            byte[] serialised = JavaUtils.objectMapper.writeValueAsBytes(metadata);
            if (serialised.length > MAX_METADATA_BYTES) {
                throw new IllegalArgumentException("Pyng metadata exceeds 4 KiB");
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException("Pyng metadata could not be serialised", e);
        }
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
        StatusRecorder recorder = statusRecorder;
        if (recorder == null) {
            FulfilmentSessionRepository.updatePyngMetadata(fulfilmentSessionId, metadata);
        } else {
            recorder.save(fulfilmentSessionId, metadata);
        }
        logger.info("Pyng checkout finished for fulfilment session {} with status {}", fulfilmentSessionId, status);
        return true;
    }

    private static String orderId(PyngCheckoutFulfilmentSession session) {
        String orderId = session.getId();
        // The same value is sent as X-Pyng-Request-Id, which allows at most 255 characters.
        if (orderId == null || orderId.isBlank() || orderId.length() > 255) {
            throw new IllegalArgumentException("Pyng orderId must be 1-255 characters");
        }
        return orderId;
    }

    private static int checkoutAmountCents(PyngCheckoutFulfilmentSession session) {
        if (session.getEventData() == null) {
            throw new IllegalArgumentException("Pyng checkout session is missing event data");
        }
        if (session.getNumTickets() == null || session.getNumTickets() < 1) {
            throw new IllegalArgumentException("Pyng checkout session numTickets must be at least 1");
        }
        ResolvedEventTicketType ticketType = EventTicketTypeService.resolveById(
                session.getEventData(), session.getEventTicketTypeId());
        Integer price = ticketType.getPrice();
        if (price == null) {
            throw new IllegalArgumentException("Ticket type " + ticketType.getId() + " is missing a price");
        }
        long amount;
        try {
            amount = Math.multiplyExact(price.longValue(), session.getNumTickets().longValue());
        } catch (ArithmeticException e) {
            throw new IllegalArgumentException("Pyng checkout amount overflowed", e);
        }
        if (amount < 1 || amount > Integer.MAX_VALUE) {
            throw new IllegalArgumentException("Pyng checkout amount must be an integer number of cents of at least 1");
        }
        return (int) amount;
    }

    private static String returnUrl(PyngCheckoutFulfilmentSession session) {
        String url = PyngConfig.returnBaseUrl() + "/fulfilment/"
                + encodePath(session.getId()) + "/" + encodePath(pyngEntityId(session));
        if (url.length() > MAX_RETURN_URL_LENGTH) {
            throw new IllegalArgumentException("Pyng return URL exceeds 2048 characters");
        }
        URI uri = URI.create(url);
        if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null) {
            throw new IllegalStateException(
                    "Pyng return URL must be https and its origin must be on the site allowlist. Set "
                            + PyngConfig.RETURN_BASE_URL + " when the app origin is not https.");
        }
        return url;
    }

    private static String pyngEntityId(PyngCheckoutFulfilmentSession session) {
        List<String> ids = session.getFulfilmentEntityIds();
        Map<String, FulfilmentEntity> entities = session.getFulfilmentEntityMap();
        if (ids == null || entities == null) {
            throw new IllegalStateException("Pyng checkout session is missing fulfilment entities");
        }
        for (String id : ids) {
            FulfilmentEntity entity = entities.get(id);
            if (entity != null && entity.getType() == FulfilmentEntityType.PYNG) {
                return id;
            }
        }
        throw new IllegalStateException("Pyng checkout session has no PYNG fulfilment entity");
    }

    private static Map<String, String> metadata(PyngCheckoutFulfilmentSession session) {
        Map<String, String> metadata = new LinkedHashMap<>();
        metadata.put("fulfilmentSessionId", session.getId());
        if (session.getEventData().getEventId() != null && !session.getEventData().getEventId().isBlank()) {
            metadata.put("eventId", session.getEventData().getEventId());
        }
        if (session.getEventTicketTypeId() != null && !session.getEventTicketTypeId().isBlank()) {
            metadata.put("eventTicketTypeId", session.getEventTicketTypeId());
        }
        validateMetadata(metadata);
        return metadata;
    }

    private static String encodePath(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
    }

    private static String urlDecode(String value) {
        try {
            return URLDecoder.decode(value, StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            return value;
        }
    }
}
