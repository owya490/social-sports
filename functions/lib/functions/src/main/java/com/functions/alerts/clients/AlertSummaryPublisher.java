package com.functions.alerts.clients;

import com.functions.alerts.models.ErrorAlertNotification;

public interface AlertSummaryPublisher {
    void publish(ErrorAlertNotification notification);
}
