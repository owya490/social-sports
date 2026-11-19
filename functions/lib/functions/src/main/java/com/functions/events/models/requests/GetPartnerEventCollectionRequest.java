package com.functions.events.models.requests;

import javax.annotation.Nullable;

public record GetPartnerEventCollectionRequest(@Nullable String partner, String eventCollectionId) {}
