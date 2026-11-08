package com.functions.global.models.requests;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.functions.utils.JavaUtils;
import com.google.cloud.Timestamp;

/**
 * Inclusive range. The span from start to end is at most 30 days.
 */
public record DateRangeRequest(
        @JsonDeserialize(using = JavaUtils.TimestampDeserializer.class) Timestamp start,
        @JsonDeserialize(using = JavaUtils.TimestampDeserializer.class) Timestamp end) {
    private static final long MAX_SPAN_SECONDS = 30L * 24 * 60 * 60;

    public static DateRangeRequest parse(UnifiedRequest data) {
        try {
            DateRangeRequest request = JavaUtils.objectMapper.treeToValue(data.data(), DateRangeRequest.class);
            if (request == null) {
                throw new IllegalArgumentException("start and end are required");
            }
            request.validate();
            return request;
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Failed to parse date range", e);
        }
    }

    public void validate() {
        if (start == null || end == null) {
            throw new IllegalArgumentException("start and end are required");
        }
        if (end.compareTo(start) < 0) {
            throw new IllegalArgumentException("start must be on or before end");
        }
        Timestamp maxEnd = Timestamp.ofTimeSecondsAndNanos(start.getSeconds() + MAX_SPAN_SECONDS, start.getNanos());
        if (end.compareTo(maxEnd) > 0) {
            throw new IllegalArgumentException("date range must be 30 days or less");
        }
    }
}
