package com.functions.global.models.responses;

/**
 * Unified response wrapper for successful responses only.
 * <p>
 * This class is used to wrap successful response data from the GlobalAppController. For error
 * responses, use ErrorResponse.java instead, which provides a consistent error format across all
 * endpoints.
 * <p>
 * Example success response: { "data": { // Actual response data here } }
 */
public record UnifiedResponse<T>(T data) {
    /**
     * Creates a successful response with the provided data.
     *
     * @param data The response data to wrap
     * @return A UnifiedResponse containing the data
     */
    public static <T> UnifiedResponse<T> success(T data) {
        return new UnifiedResponse<>(data);
    }
}
