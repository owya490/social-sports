package com.functions.tickets.handlers;

import com.functions.global.models.AuthContext;
import com.functions.global.models.Handler;
import com.functions.global.services.EventAuthorizationService;
import com.functions.global.models.requests.DateRangeRequest;
import com.functions.global.models.requests.UnifiedRequest;
import com.functions.tickets.models.responses.GetSalesInRangeResponse;
import com.functions.tickets.repositories.OrdersRepository;
import com.functions.tickets.repositories.TicketsRepository;

public class GetSalesInRangeHandler implements Handler<DateRangeRequest, GetSalesInRangeResponse> {
    @Override
    public DateRangeRequest parse(UnifiedRequest data) {
        return DateRangeRequest.parse(data);
    }

    @Override
    public GetSalesInRangeResponse handle(DateRangeRequest request, AuthContext authContext) {
        EventAuthorizationService.requireDateRangeAccount(authContext.requireUid());
        request.validate();
        return new GetSalesInRangeResponse(
                OrdersRepository.getOrdersPurchasedBetween(request.start(), request.end()),
                TicketsRepository.getTicketsPurchasedBetween(request.start(), request.end()));
    }
}
