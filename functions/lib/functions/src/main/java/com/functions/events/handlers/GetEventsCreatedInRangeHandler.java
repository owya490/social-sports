package com.functions.events.handlers;

import com.functions.events.models.responses.GetEventsCreatedInRangeResponse;
import com.functions.events.repositories.EventsRepository;
import com.functions.global.models.AuthContext;
import com.functions.global.services.EventAuthorizationService;
import com.functions.global.models.Handler;
import com.functions.global.models.requests.DateRangeRequest;
import com.functions.global.models.requests.UnifiedRequest;

public class GetEventsCreatedInRangeHandler implements Handler<DateRangeRequest, GetEventsCreatedInRangeResponse> {
    @Override
    public DateRangeRequest parse(UnifiedRequest data) {
        return DateRangeRequest.parse(data);
    }

    @Override
    public GetEventsCreatedInRangeResponse handle(DateRangeRequest request, AuthContext authContext) {
        EventAuthorizationService.requireDateRangeAccount(authContext.requireUid());
        request.validate();
        return new GetEventsCreatedInRangeResponse(
                EventsRepository.getEventsCreatedBetween(request.start(), request.end()));
    }
}
