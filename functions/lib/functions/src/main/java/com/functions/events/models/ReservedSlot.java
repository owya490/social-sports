package com.functions.events.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * A reserved slot entry for recurring events.
 * Allows organisers to pre-reserve spots for specific email addresses.
 * These will be added as actual attendees in the manage attendees list.
 */
@Data
@NoArgsConstructor // Required by Firestore
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ReservedSlot {
    private String email;
    private String name; // Attendee name (required for purchaserMap)
    private Integer slots; // Number of tickets reserved for this email
}
