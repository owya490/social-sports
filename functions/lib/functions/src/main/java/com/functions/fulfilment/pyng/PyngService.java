package com.functions.fulfilment.pyng;

import java.io.IOException;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Pattern;

import com.functions.events.models.ResolvedEventTicketType;
import com.functions.events.services.EventTicketTypeService;
import com.functions.events.utils.EventsUtils;
import com.functions.fulfilment.models.fulfilmentSession.PyngCheckoutFulfilmentSession;
import com.functions.fulfilment.models.fulfilmentSession.PyngMetadata;
import com.functions.fulfilment.payment.PaymentStatus;
import com.functions.users.models.PrivateUserData;
import com.functions.users.services.Users;
import com.functions.utils.JavaUtils;

/**
 * Pyng hosted checkout. Creates a Checkout Session and reads its status.
 */
public final class PyngService {
    private static final Pattern METADATA_KEY = Pattern.compile("[A-Za-z0-9_-]{1,40}");
    private static final int MAX_METADATA_KEYS = 20;
    private static final int MAX_METADATA_VALUE_CHARS = 500;
    private static final int MAX_METADATA_BYTES = 4096;
    private static final int MAX_RETURN_URL_LENGTH = 2048;

    // Replaced in tests so checkout calls do not hit Pyng or Firestore.
    static volatile PyngCheckoutClient client = PyngCheckoutClient.http();
    static volatile SiteIdSource siteIds;

    @FunctionalInterface
    interface SiteIdSource {
        String siteId(PyngCheckoutFulfilmentSession session) throws Exception;
    }

    private PyngService() {
    }

    public static PyngHostedCheckout createHostedCheckout(PyngCheckoutFulfilmentSession session) {
        if (session == null) {
            throw new IllegalArgumentException("Pyng checkout session is required");
        }
        String orderId = orderId(session);
        String siteId = resolveSiteId(session);
        // Same id on retry returns the original session when the body matches.
        // A different body for this id is rejected by Pyng with 409.
        String requestId = orderId;
        try {
            return client.createSession(new PyngCheckoutClient.CreateCheckoutSession(
                    requestId,
                    orderId,
                    checkoutAmountCents(session),
                    returnUrl(session),
                    metadata(session),
                    siteId));
        } catch (IOException e) {
            throw new IllegalStateException("Failed to create Pyng checkout session for order " + orderId, e);
        }
    }

    public static PaymentStatus pollCheckout(PyngMetadata metadata) {
        if (metadata == null || metadata.getCheckoutSessionId() == null
                || metadata.getCheckoutSessionId().isBlank()) {
            throw new IllegalArgumentException("Pyng checkout session id is required to poll status");
        }
        if (metadata.getSiteId() == null || metadata.getSiteId().isBlank()) {
            throw new IllegalArgumentException("Pyng site id is required to poll status");
        }
        try {
            return client.getStatus(metadata.getSiteId(), metadata.getCheckoutSessionId());
        } catch (IOException e) {
            throw new IllegalStateException(
                    "Failed to read Pyng checkout session " + metadata.getCheckoutSessionId(), e);
        }
    }

    /**
     * Checks the return-redirect signature. The redirect is not the payment
     * outcome. When the site has no signing secret the signature is ignored.
     * Inputs may still be URL-encoded.
     */
    public static boolean verifyReturnSignature(String checkoutSessionId, String transactionStatus, String signature) {
        String secret = PyngConfig.signingSecret();
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

    private static String resolveSiteId(PyngCheckoutFulfilmentSession session) {
        try {
            SiteIdSource source = siteIds;
            String siteId = source == null ? siteIdFromOrganiser(session) : source.siteId(session);
            if (siteId == null || siteId.isBlank()) {
                throw new IllegalStateException("Pyng site id is missing");
            }
            return siteId.trim();
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("Failed to load Pyng site id", e);
        }
    }

    private static String siteIdFromOrganiser(PyngCheckoutFulfilmentSession session) throws Exception {
        String organiserId = EventsUtils.extractOrganiserIdForEvent(session.getEventData());
        PrivateUserData organiser = Users.getPrivateUserDataById(organiserId);
        if (organiser == null || organiser.getPyngSiteId() == null || organiser.getPyngSiteId().isBlank()) {
            throw new IllegalStateException("Organiser " + organiserId + " has no Pyng site id");
        }
        return organiser.getPyngSiteId();
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
        if (session.getEventData() == null || session.getEventData().getEventId() == null
                || session.getEventData().getEventId().isBlank()) {
            throw new IllegalArgumentException("Pyng return URL requires an event id");
        }
        // The original tab keeps polling. This tab only tells the buyer to go back.
        String url = PyngConfig.returnBaseUrl() + "/fulfilment/pyng-complete";
        if (url.length() > MAX_RETURN_URL_LENGTH) {
            throw new IllegalArgumentException("Pyng return URL exceeds 2048 characters");
        }
        URI uri = URI.create(url);
        if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null) {
            throw new IllegalStateException(
                    "Pyng return URL must be https and its origin must be on the site allowlist.");
        }
        return url;
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

    private static String urlDecode(String value) {
        try {
            return URLDecoder.decode(value, StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            return value;
        }
    }
}
