package com.functions.tickets.models;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.functions.utils.JavaUtils;
import com.google.cloud.Timestamp;

import lombok.Data;

/**
 * Represents an order containing one or more tickets.
 * Matches the TypeScript Order interface.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class Order {
    private String orderId;
    private long applicationFees; // in cents
    @JsonSerialize(using = JavaUtils.TimestampSerializer.class)
    @JsonDeserialize(using = JavaUtils.TimestampDeserializer.class)
    private Timestamp datePurchased;
    private long discounts; // in cents
    private String email;
    private String fullName;
    private String phone;
    private List<String> tickets = new ArrayList<>(); // List of ticketIds
    private String stripePaymentIntentId;
    private OrderAndTicketStatus status = OrderAndTicketStatus.APPROVED;
    private OrderAndTicketType type = OrderAndTicketType.GENERAL;
}
