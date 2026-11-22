package com.functions.events.models;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.Data;

/** Public event-collection document. Extra stored fields are ignored. */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class EventCollectionData {
    private String name;
    private String description;
    private String image;
    private String organiserId;
    private Boolean isPrivate;
    private List<String> eventIds;
}
