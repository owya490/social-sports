package com.functions.events.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.google.cloud.firestore.annotation.Exclude;
import lombok.*;

@Value
@Builder(toBuilder = true)
@NoArgsConstructor(force = true, access = AccessLevel.PRIVATE)
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class RecurrenceTemplate {
    public static final int SCHEMA_VERSION_V1 = 1;
    public static final int SCHEMA_VERSION_V2 = 2;

    Integer schemaVersion;
    NewEventData eventData;
    RecurrenceData recurrenceData;

    @Exclude
    @JsonIgnore
    public boolean isV2() {
        return schemaVersion != null && schemaVersion == SCHEMA_VERSION_V2;
    }
}
