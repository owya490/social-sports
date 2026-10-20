package com.functions.fulfilment.pyng;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.util.Base64;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/**
 * HMAC-SHA256 over the Pyng return redirect, encoded as base64url without padding.
 * The signed parameters are presentational; checkout status stays authoritative.
 */
final class PyngReturnSignature {
    private PyngReturnSignature() {
    }

    static String sign(String secret, String checkoutSessionId, String transactionStatus) {
        String canonical = "checkoutSessionId=" + checkoutSessionId + "&transactionStatus=" + transactionStatus;
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] raw = mac.doFinal(canonical.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Failed to sign Pyng return redirect", e);
        }
    }

    static boolean matches(String expected, String actual) {
        if (expected == null || actual == null) {
            return false;
        }
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                actual.getBytes(StandardCharsets.UTF_8));
    }
}
