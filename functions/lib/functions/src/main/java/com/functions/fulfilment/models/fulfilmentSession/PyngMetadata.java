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
    private PaymentStatus status;
}
