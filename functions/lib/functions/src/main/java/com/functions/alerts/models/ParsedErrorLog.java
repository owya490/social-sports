package com.functions.alerts.models;

import java.time.Instant;

import com.functions.alerts.services.AlertTextRedactor;
import com.functions.alerts.services.SmsText;

public record ParsedErrorLog(
        String functionName,
        String message,
        String exceptionType,
        String topFrame,
        Instant timestamp,
        String trace,
        String requestMethod,
        Integer httpStatus,
        String logName,
        String insertId) {

    public ParsedErrorLog {
        functionName = SmsText.truncate(AlertTextRedactor.redact(functionName), 100);
        message = AlertTextRedactor.redact(message);
        if (message.length() > 2500) {
            message = message.substring(0, 2500);
        }
        exceptionType = AlertTextRedactor.redact(exceptionType);
        topFrame = SmsText.truncate(AlertTextRedactor.redact(topFrame), 500);
        requestMethod = SmsText.truncate(requestMethod, 20);
    }

    public ParsedErrorLog(String functionName, String message, String exceptionType, String topFrame) {
        this(functionName, message, exceptionType, topFrame, null, null, "", null, "", "");
    }

    public ParsedErrorLog(String functionName, String message, String exceptionType, String topFrame,
            Instant timestamp, String trace) {
        this(functionName, message, exceptionType, topFrame, timestamp, trace, "", null, "", "");
    }

}
