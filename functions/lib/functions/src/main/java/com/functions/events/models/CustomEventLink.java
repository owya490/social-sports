package com.functions.events.models;

import com.google.firebase.database.annotations.Nullable;

public record CustomEventLink(
  String customEventLink, 
  String customEventLinkName, 
  String id, 
  @Nullable String eventReference,
  @Nullable String referenceId, 
  @Nullable String referenceName, 
  String type
  ) {
  
  public enum Type {
    EVENT("event"),
    RECURRING_EVENT("recurring");
    
    private final String type;
    
    Type(String type) {
      this.type = type;
    }
    public String getType() {
      return type;
    }
  }
}
