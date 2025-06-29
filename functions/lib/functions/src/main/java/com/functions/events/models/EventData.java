package com.functions.events.models;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class EventData extends AbstractEventData{
    private String eventId;
    // We'll exclude organiser field for now in Java as there is no need for it.
    // We'll add it back in here when Java actually needs it.
    // private PublicUserData organiser;
}
