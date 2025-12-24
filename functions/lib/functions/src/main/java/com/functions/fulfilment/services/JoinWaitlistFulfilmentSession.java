package com.functions.fulfilment.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class JoinWaitlistFulfilmentSession {
    
    private static final Logger logger = LoggerFactory.getLogger(JoinWaitlistFulfilmentSession.class);

    // we just need the fulfilment session id and event id since that's all the info we need to initialise the session
    public JoinWaitlistFulfilmentSession initFulfilmentSession(String fulfilmentSessionId, String eventId) {
        return JoinWaitlistFulfilmentSession.builder()
        .fulfilmentSessionId(fulfilmentSessionId)
        .eventId(eventId)
        .build();
    }


}
