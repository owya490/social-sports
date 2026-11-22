package com.functions.events.models.requests;

import javax.annotation.Nullable;

public record GetPartnerEventRequest(@Nullable String partner, String eventId) {}
