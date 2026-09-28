package com.functions.payments.completion.models;

import java.util.HashMap;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.functions.utils.JavaUtils;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.annotation.DocumentId;

import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class FulfilmentCompletionJob {
    @DocumentId
    private String id;
    private FulfilmentCompletionJobType type;
    private FulfilmentCompletionJobStatus status;
    private String provider;
    private String paymentRef;
    private String fulfilmentSessionId;
    private String paymentEntityId;
    private Map<String, Object> payload = new HashMap<>();
    private int attemptCount;
    @JsonSerialize(using = JavaUtils.TimestampSerializer.class)
    @JsonDeserialize(using = JavaUtils.TimestampDeserializer.class)
    private Timestamp leaseUntil;
    private String lastError;
    @JsonSerialize(using = JavaUtils.TimestampSerializer.class)
    @JsonDeserialize(using = JavaUtils.TimestampDeserializer.class)
    private Timestamp createdAt;
    @JsonSerialize(using = JavaUtils.TimestampSerializer.class)
    @JsonDeserialize(using = JavaUtils.TimestampDeserializer.class)
    private Timestamp updatedAt;
}
