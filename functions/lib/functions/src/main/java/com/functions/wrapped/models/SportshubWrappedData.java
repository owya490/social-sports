package com.functions.wrapped.models;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Record representing the Sportshub Wrapped data for an organiser.
 * Contains all metrics and statistics for their year in review.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record SportshubWrappedData(
    String organiserName,
    String organiserId,
    int year,
    DateRange dateRange,
    int eventsCreated,
    int ticketsSold,
    long totalSales, // in cents
    int totalEventViews,
    List<TopAttendee> topRegularAttendees,
    MostPopularEvent mostPopularEvent,
    int minutesSavedBookkeeping,
    long feesSavedVsEventbrite, // in cents
    String wrappedId
) {
    
    public record DateRange(
        String from, // ISO date
        String to    // ISO date
    ) {}
    
    public record TopAttendee(
        String name,
        String email,
        int attendanceCount
    ) {}
    
    public record MostPopularEvent(
        String eventId,
        String eventImage,
        String name,
        int attendance,
        long revenue // in cents
    ) {}
}

