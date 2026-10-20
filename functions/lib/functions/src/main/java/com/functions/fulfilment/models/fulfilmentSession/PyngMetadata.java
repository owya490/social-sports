package com.functions.fulfilment.models.fulfilmentSession;

import com.functions.fulfilment.payment.PaymentStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PyngMetadata {
    private String checkoutSessionId;
    private String hostedPageUrl;
    /**
     * Organiser site id used to create this checkout. Later status reads use the
     * same id so a changed organiser record cannot point at a different site.
     */
    private String siteId;
    private PaymentStatus status;
}
