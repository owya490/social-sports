package com.functions.payments.completion.models;

import java.util.List;

public record ProcessDueSummary(int processed, int skipped, int failed, List<ProcessJobOutcome> jobs) {
}
