package com.functions.events.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.google.firebase.database.annotations.Nullable;

public record CustomEventLink(
  String customEventLink, 
  String customEventLinkName, 
  String id, 
  @Nullable String eventReference,
  @Nullable String referenceId, 
  @Nullable String referenceName, 
  Type type
  ) {
  
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
