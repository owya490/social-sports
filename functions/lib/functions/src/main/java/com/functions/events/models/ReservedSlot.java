package com.functions.events.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Builder;
import lombok.Value;
import lombok.extern.jackson.Jacksonized;

/**
 * A reserved slot entry for recurring events.
 * Allows organisers to pre-reserve spots for specific email addresses.
 */
@Value
@Builder(toBuilder = true)
@Jacksonized
@JsonIgnoreProperties(ignoreUnknown = true)
public class ReservedSlot {
    String email;
    Integer slots; // Number of tickets reserved for this email
}

