package com.functions.stripe.models;

import java.util.List;

import com.google.cloud.Timestamp;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents an order for event tickets.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Order {
    private Timestamp datePurchased;
    private String email;
    private String fullName;
    private String phone;
    private Long applicationFees;
    private Long discounts;
    private List<String> tickets;
}

