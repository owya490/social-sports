package com.functions.global.models;

import com.functions.global.models.requests.UnifiedRequest;
import com.functions.utils.logging.RequestLogContext;

/**
 * API which service layer should implement to be called by GlobalAppController.
 *
 * @param <S> request data type
 * @param <T> response data type
 */
public interface Handler<S, T> {
    S parse(UnifiedRequest data);

    T handle(S parsedRequestData) throws Exception;

    default T handle(S parsedRequestData, RequestLogContext logContext) throws Exception {
        return handle(parsedRequestData);
    }
}
