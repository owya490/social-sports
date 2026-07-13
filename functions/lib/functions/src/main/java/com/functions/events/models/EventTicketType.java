package com.functions.events.models;

import javax.annotation.Nullable;

import lombok.Data;

@Data
public class EventTicketType {
    private String name;
    @Nullable
    private String description;
    private Integer price;
    private Integer capacity;
    private Integer vacancy;
    @Nullable
    private String formId;
    private Integer sortOrder;
  @Nullable
    private Boolean isActive;
}
