package com.functions.fulfilment.models.fulfilmentSession;

import com.functions.fulfilment.models.FulfilmentSessionService;
import com.functions.fulfilment.services.BookingApprovalFulfilmentService;
import com.functions.fulfilment.services.CheckoutFulfilmentService;
import com.functions.fulfilment.services.WaitlistFulfilmentService;

import lombok.Getter;

@Getter
public enum FulfilmentSessionType {
    CHECKOUT(new CheckoutFulfilmentService()),
    BOOKING_APPROVAL(new BookingApprovalFulfilmentService()),
    WAITLIST(new WaitlistFulfilmentService());

    private final FulfilmentSessionService<? extends FulfilmentSession> fulfilmentSessionService;

    FulfilmentSessionType(FulfilmentSessionService<? extends FulfilmentSession> fulfilmentSessionService) {
        this.fulfilmentSessionService = fulfilmentSessionService;
    }
}
