package com.functions.fulfilment.models.responses;

import com.functions.fulfilment.payment.PaymentStatus;

public record RefreshPyngCheckoutResponse(PaymentStatus paymentStatus) {
}
