package com.functions.wrapped.models;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Class representing the Sportshub Wrapped data for an organiser.
 * Contains all metrics and statistics for their year in review.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class SportshubWrappedData {
    private String organiserName;
    private String organiserId;
    private int year;
    private DateRange dateRange;
    private int eventsCreated;
    private int ticketsSold;
    private long totalSales; // in cents
    private int totalEventViews;
    private List<TopAttendee> topRegularAttendees;
    private MostPopularEvent mostPopularEvent;
    private int minutesSavedBookkeeping;
    private long feesSavedVsEventbrite; // in cents
    private String wrappedId;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class DateRange {
        private String from; // ISO date
        private String to;   // ISO date
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TopAttendee {
        private String name;
        private String email;
        private int attendanceCount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class MostPopularEvent {
        private String eventId;
        private String eventImage;
        private String name;
        private int attendance;
        private long revenue; // in cents
    }
}
