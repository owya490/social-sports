package com.functions.events.models.responses;

import java.util.List;

import javax.annotation.Nullable;

import com.functions.events.models.responses.GetPartnerEventsResponse.PartnerEvent;

public record GetPartnerEventCollectionResponse(
        String eventCollectionId,
        String name,
        String description,
        @Nullable String image,
        List<PartnerEvent> events) {}
