package com.functions.tickets.models.requests.create;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.functions.tickets.models.OrderAndTicketStatus;

@JsonIgnoreProperties(ignoreUnknown = true)
public record CreateOrderRequest(
        @JsonProperty("eventId") String eventId,
        @JsonProperty("email") String email,
        @JsonProperty("fullName") String fullName,
        @JsonProperty("phone") String phone,
        @JsonProperty("stripePaymentIntentId") String stripePaymentIntentId,
        @JsonProperty("status") OrderAndTicketStatus status,
        @JsonProperty("tickets") List<TicketInput> tickets) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record TicketInput(
            @JsonProperty("price") long price,
            @JsonProperty("formResponseId") String formResponseId) {
    }
}
