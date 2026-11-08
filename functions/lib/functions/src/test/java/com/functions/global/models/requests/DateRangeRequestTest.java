package com.functions.global.models.requests;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.fail;

import org.junit.Test;

import com.functions.global.models.EndpointType;
import com.functions.utils.JavaUtils;
import com.google.cloud.Timestamp;

public class DateRangeRequestTest {
    private static final Timestamp START = Timestamp.parseTimestamp("2026-11-01T00:00:00Z");

    @Test
    public void acceptsThirtyDaysInclusive() {
        Timestamp end = Timestamp.ofTimeSecondsAndNanos(START.getSeconds() + 30L * 24 * 60 * 60, START.getNanos());
        new DateRangeRequest(START, end).validate();
    }

    @Test
    public void rejectsMoreThanThirtyDays() {
        Timestamp end = Timestamp.ofTimeSecondsAndNanos(START.getSeconds() + 30L * 24 * 60 * 60, START.getNanos() + 1);
        try {
            new DateRangeRequest(START, end).validate();
            fail("Expected a range over 30 days to fail");
        } catch (IllegalArgumentException expected) {
            assertEquals("date range must be 30 days or less", expected.getMessage());
        }
    }

    @Test
    public void parsesAndValidates() throws Exception {
        UnifiedRequest request = new UnifiedRequest(
                EndpointType.GET_SALES_IN_RANGE,
                JavaUtils.objectMapper.readTree("{\"start\":\"2026-11-01T00:00:00Z\",\"end\":\"2026-11-08T00:00:00Z\"}"));

        DateRangeRequest parsed = DateRangeRequest.parse(request);

        assertEquals(START, parsed.start());
        assertEquals(Timestamp.parseTimestamp("2026-11-08T00:00:00Z"), parsed.end());
    }
}
