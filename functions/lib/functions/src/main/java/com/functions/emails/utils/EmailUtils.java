package com.functions.emails.utils;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

import com.google.cloud.Timestamp;

public class EmailUtils {
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MM/dd/yyyy, HH:mm");
    private static final ZoneId SYDNEY_TIMEZONE = ZoneId.of("Australia/Sydney");
    
    /**
     * Formats a Firestore Timestamp to a readable date string in Sydney timezone.
     * 
     * @param timestamp The Firestore Timestamp to format
     * @return The formatted date string
     */
        public static String formatTimestamp(Timestamp timestamp) {
            if (timestamp == null) return "";
            ZonedDateTime zdt = ZonedDateTime.ofInstant(
                Instant.ofEpochSecond(timestamp.getSeconds(), timestamp.getNanos()), 
                SYDNEY_TIMEZONE
            );
    
            return zdt.format(DATE_FORMATTER);
        }
}
