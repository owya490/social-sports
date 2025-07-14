package com.functions.events.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.google.firebase.database.annotations.Nullable;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor // Required by Firestore
@AllArgsConstructor // Optional but useful for manual instantiation
public class CustomEventLink {
    private String customEventLink;
    private String customEventLinkName;
    private String id;
    @Nullable
    private String eventReference;
    @Nullable
    private String referenceId;
    @Nullable
    private String referenceName;
    private String type; // Type is a string because it is stored as a string in Firestore

    public enum Type {
        EVENT("event"),
        RECURRING_EVENT("recurring");

        private final String type;

        Type(String type) {
            this.type = type;
        }

        @JsonValue
        public String getType() {
            return type;
        }

        @JsonCreator
        public static Type fromString(String value) {
            for (Type t : Type.values()) {
                if (t.type.equalsIgnoreCase(value)) {
                    return t;
                }
            }
            throw new IllegalArgumentException("Unknown type: " + value);
        }
    }
}