package com.functions.stripe.models.requests;

import com.fasterxml.jackson.annotation.JsonProperty;

/** Payout details collected on Getting Paid. Bank details and the ABN are not stored. */
public record StartStripePayoutOnboardingRequest(
        @JsonProperty("firstName") String firstName,
        @JsonProperty("lastName") String lastName,
        @JsonProperty("email") String email,
        @JsonProperty("hasAbn") boolean hasAbn,
        @JsonProperty("abn") String abn,
        @JsonProperty("dateOfBirth") String dateOfBirth,
        @JsonProperty("addressLine1") String addressLine1,
        @JsonProperty("city") String city,
        @JsonProperty("state") String state,
        @JsonProperty("postcode") String postcode,
        @JsonProperty("accountHolderName") String accountHolderName,
        @JsonProperty("bsb") String bsb,
        @JsonProperty("accountNumber") String accountNumber) {
}
