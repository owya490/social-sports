package com.functions.global.models;

/**
 * API which service layer should implement to be called by GlobalAppController.
 *
 * @param <S> response type
 * @param <T> request data type
 */
public interface Service<S, T> {
    S handle(T data);
}
