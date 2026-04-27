package com.functions.global.models;

import com.functions.auth.models.RequestContext;
import com.functions.global.models.requests.UnifiedRequest;

/**
 * API which service layer should implement to be called by GlobalAppController.
 *
 * @param <S> request data type
 * @param <T> response data type
 */
public interface Handler<S, T> {
    S parse(UnifiedRequest data);

    default T handle(S parsedRequestData) throws Exception {
        return handle(parsedRequestData, null);
    }

    default T handle(S parsedRequestData, RequestContext requestContext) throws Exception {
        return handle(parsedRequestData);
    }
}
