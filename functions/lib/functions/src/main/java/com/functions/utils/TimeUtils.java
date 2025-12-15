package com.functions.utils;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

import com.functions.wrapped.models.SportshubWrappedData.DateRange;
import com.google.cloud.Timestamp;

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

	// This function converts the Timestamp which is always stored as UTC time to a
	// string representation in the
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

	/**
	 * Parses an ISO date string (e.g., "2025-01-15") to LocalDate.
	 *
	 * @param isoDateString The ISO date string
	 * @return The parsed LocalDate
	 */
	public static LocalDate parseIsoDateToLocalDate(String isoDateString) {
		return LocalDate.parse(isoDateString, DateTimeFormatter.ISO_LOCAL_DATE);
	}

	/**
	 * Parses an ISO datetime string (e.g., "2025-01-15T10:30:00") to LocalDate.
	 * Extracts just the date portion.
	 *
	 * @param isoDateTimeString The ISO datetime string
	 * @return The parsed LocalDate
	 */
	public static LocalDate parseIsoDateTimeToLocalDate(String isoDateTimeString) {
		LocalDateTime dateTime = LocalDateTime.parse(isoDateTimeString, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
		return dateTime.toLocalDate();
	}

	/**
	 * Converts a Firestore Timestamp to LocalDate.
	 *
	 * @param timestamp The Firestore Timestamp
	 * @return The LocalDate
	 */
	public static LocalDate timestampToLocalDate(Timestamp timestamp) {
		return timestamp.toDate().toInstant()
				.atZone(ZoneId.systemDefault())
				.toLocalDate();
	}

	/**
	 * Converts an ISO date string to a Firestore Timestamp (at start of day).
	 *
	 * @param isoDateString The ISO date string
	 * @return The Firestore Timestamp
	 */
	public static Timestamp isoDateToTimestamp(String isoDateString) {
		LocalDate date = parseIsoDateToLocalDate(isoDateString);
		return Timestamp.ofTimeSecondsAndNanos(
				date.atStartOfDay(ZoneId.systemDefault()).toEpochSecond(), 0);
	}

	/**
	 * Converts a DateRange to start and end Timestamps.
	 *
	 * @param dateRange The date range
	 * @return Array of [startTimestamp, endTimestamp]
	 */
	public static Timestamp[] dateRangeToTimestamps(DateRange dateRange) {
		Timestamp start = isoDateToTimestamp(dateRange.from());
		// End timestamp should be end of day
		LocalDate endDate = parseIsoDateToLocalDate(dateRange.to());
		Timestamp end = Timestamp.ofTimeSecondsAndNanos(
				endDate.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toEpochSecond() - 1, 0);
		return new Timestamp[] { start, end };
	}

	/**
	 * Checks if a LocalDate falls within the given DateRange (inclusive).
	 *
	 * @param date      The date to check
	 * @param dateRange The date range
	 * @return true if the date is within the range
	 */
	public static boolean isDateInRange(LocalDate date, DateRange dateRange) {
		LocalDate from = parseIsoDateToLocalDate(dateRange.from());
		LocalDate to = parseIsoDateToLocalDate(dateRange.to());
		return !date.isBefore(from) && !date.isAfter(to);
	}

	/**
	 * Checks if a Firestore Timestamp falls within the given DateRange.
	 *
	 * @param timestamp The timestamp to check
	 * @param dateRange The date range
	 * @return true if the timestamp is within the range
	 */
	public static boolean isTimestampInRange(Timestamp timestamp, DateRange dateRange) {
		LocalDate date = timestampToLocalDate(timestamp);
		return isDateInRange(date, dateRange);
	}
}
