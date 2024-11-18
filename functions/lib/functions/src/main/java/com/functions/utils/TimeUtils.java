package com.functions.utils;

import com.google.cloud.Timestamp;

import java.time.*;
import java.time.format.DateTimeFormatter;


public class TimeUtils {
	public static LocalDateTime convertTimestampToLocalDateTime(Timestamp timestamp) {
		Instant instant = Instant.ofEpochSecond(timestamp.getSeconds(), timestamp.getNanos());
		return instant.atZone(ZoneOffset.UTC).toLocalDateTime();
	}

	public static Timestamp convertLocalDateTimeToTimestamp(LocalDateTime localDateTime) {
		ZonedDateTime zonedDateTime = localDateTime.atZone(ZoneOffset.UTC);
		Instant instant = zonedDateTime.toInstant();
        
        // Convert Instant to com.google.cloud.Timestamp
		return Timestamp.ofTimeSecondsAndNanos(instant.getEpochSecond(), instant.getNano());
	}

	public static Timestamp convertZonedDateTimeToTimestamp(ZonedDateTime zonedDateTime) {
		Instant instant = zonedDateTime.toInstant();
		return Timestamp.ofTimeSecondsAndNanos(instant.getEpochSecond(), instant.getNano());
	}

	public static Timestamp convertTimestampToSydneyTimezone(Timestamp timestamp) {
		ZonedDateTime zonedDateTime = timestamp.toSqlTimestamp().toInstant()
                                .atZone(ZoneId.of("Australia/Sydney"));
								return convertZonedDateTimeToTimestamp(zonedDateTime);
	}

	public static Timestamp convertMillisecondsToTimestamp(Long milliseconds) {
		long seconds = milliseconds / 1000;
		int nanos = (int) ((milliseconds % 1000) * 1_000_000);

		Timestamp timestamp = Timestamp.ofTimeSecondsAndNanos(seconds, nanos);
		return timestamp;
	}

	// This function converts the Timestamp which is always stored as UTC time to a string representation in the
	// specified timezone.
	public static String getTimestampStringFromTimezone(Timestamp timestamp, ZoneId zoneId) {
		// Convert to Instant
        Instant instant = timestamp.toSqlTimestamp().toInstant();

        // Convert to ZonedDateTime in the Australia/Sydney timezone
        ZonedDateTime sydneyTime = instant.atZone(zoneId);

        // Format the output to include timezone shift
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss O");
        String formattedTime = sydneyTime.format(formatter);

		return formattedTime;
	}
}
