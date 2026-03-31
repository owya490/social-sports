package com.functions.events.models;

import java.util.List;
import java.util.Map;

import lombok.Data;

@Data
public class EventMetadata {
    private Map<String, Purchaser> purchaserMap;
    private Integer completeTicketCount;
    /**
     * Legacy read-only field kept for backward compatibility while production
     * metadata is migrated to completedStripeCheckoutSessionIds.
     *
     * @deprecated Use completedStripeCheckoutSessionIds for all new writes.
     */
    @Deprecated
    private List<String> completedStripeCheckoutSession;
    private List<String> completedStripeCheckoutSessionIds;
    private List<String> completedStripePaymentIntentIds;
    private String organiserId;
    private List<String> orderIds;
}
