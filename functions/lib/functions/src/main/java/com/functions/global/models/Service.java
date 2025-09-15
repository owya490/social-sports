package com.functions.global.models;

import com.functions.global.models.requests.UnifiedRequest;

/**
 * API which service layer should implement to be called by GlobalAppController.
 *
 * @param <S> request data type
 * @param <T> response data type
 */
public interface Service<S, T> {
    S parse(UnifiedRequest data);

    T handle(S parsedRequestData);
}
