package com.functions.events.models.responses;

import java.util.List;

import javax.annotation.Nullable;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.functions.events.models.PaymentProvider;
import com.functions.utils.JavaUtils;
import com.google.cloud.Timestamp;

public record GetPartnerEventsResponse(List<PartnerEvent> events) {
    public record PartnerEvent(
            String eventId,
            String name,
            String description,
            String location,
            @JsonSerialize(using = JavaUtils.TimestampSerializer.class) Timestamp startDate,
            @JsonSerialize(using = JavaUtils.TimestampSerializer.class) Timestamp endDate,
            @Nullable @JsonSerialize(using = JavaUtils.TimestampSerializer.class) Timestamp registrationDeadline,
            @Nullable String image,
            @Nullable String thumbnail,
            List<String> eventTags,
            boolean paused,
            boolean paymentsActive,
            boolean waitlistEnabled,
            boolean bookingApprovalEnabled,
            @Nullable Integer maxTicketsPerTransaction,
            List<PaymentProvider> supportedPaymentProviders,
            List<PartnerTicketType> ticketTypes) {}

    public record PartnerTicketType(
            String id,
            String name,
            int priceCents,
            boolean soldOut,
            @Nullable Integer vacancy) {}
}
