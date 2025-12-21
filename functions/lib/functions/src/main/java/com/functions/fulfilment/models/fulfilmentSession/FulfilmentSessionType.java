package com.functions.fulfilment.models.fulfilmentSession;

import com.functions.fulfilment.models.FulfilmentSessionService;
import com.functions.fulfilment.services.BookingApprovalFulfilmentService;
import com.functions.fulfilment.services.CheckoutFulfilfmentService;

import lombok.Getter;

@Getter
public enum FulfilmentSessionType {
    CHECKOUT(new CheckoutFulfilfmentService()),
    BOOKING_APPROVAL(new BookingApprovalFulfilmentService());

    private final FulfilmentSessionService<? extends FulfilmentSession> fulfilmentSessionService;

    FulfilmentSessionType(FulfilmentSessionService<? extends FulfilmentSession> fulfilmentSessionService) {
        this.fulfilmentSessionService = fulfilmentSessionService;
    }
}
