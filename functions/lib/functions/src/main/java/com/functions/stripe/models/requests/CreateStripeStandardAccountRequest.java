package com.functions.stripe.models.requests;

import java.net.URI;

public record CreateStripeStandardAccountRequest(
        String organiser,
        String returnUrl,
        String refreshUrl) {
    public CreateStripeStandardAccountRequest {
        validate(organiser, returnUrl, refreshUrl);
    }

    private static void validate(String organiser, String returnUrl, String refreshUrl) {
        if (organiser == null || organiser.isBlank()) {
            throw new IllegalArgumentException("Organiser Id must be provided as a non-empty string.");
        }
        validateUrl(returnUrl, "Return Url");
        validateUrl(refreshUrl, "Refresh Url");
    }

    private static void validateUrl(String url, String fieldName) {
        if (url == null || url.isBlank()) {
            throw new IllegalArgumentException(fieldName + " must be provided as a non-empty string.");
        }
        try {
            URI parsedUri = URI.create(url);
            if (!parsedUri.isAbsolute()
                    || parsedUri.getScheme() == null
                    || (!"http".equalsIgnoreCase(parsedUri.getScheme())
                    && !"https".equalsIgnoreCase(parsedUri.getScheme()))) {
                throw new IllegalArgumentException(fieldName + " must be a valid absolute HTTP(S) URI.");
            }
        } catch (Exception e) {
            throw new IllegalArgumentException(fieldName + " must be a valid URI.", e);
        }
    }
}
