package com.functions.alerts.clients;

import java.util.Optional;

public interface LlmClient {
    Optional<String> summarize(String prompt);
}
