package com.functions.emails.requests;

import java.util.Map;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoopsRequest {
    private String transactionalId;
    private String email;
    private Map<String, String> dataVariables;
}
