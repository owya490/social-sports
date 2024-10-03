package com.functions;

import com.google.protobuf.Timestamp;

import java.time.Instant;
// import org.threeten.bp.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
// import org.threeten.bp.LocalDate;
import java.time.ZoneId;
// import org.threeten.bp.ZoneId;

public class TimeUtils {
	public static LocalDate convertTimestampToLocalDate(Timestamp timestamp) {
		Instant instant = Instant.ofEpochSecond(timestamp.getSeconds(), timestamp.getNanos());
		return instant.atZone(ZoneId.of("Australia/Sydney")).toLocalDate();
	}

	public static Timestamp convertLocalDateToTimestamp(LocalDate localDate) {
		LocalDateTime localDateTime = localDate.atStartOfDay();
		Instant instant = localDateTime.atZone(ZoneId.of("Australia/Sydney")).toInstant();
		return Timestamp.newBuilder()
				.setSeconds(instant.getEpochSecond())
				.setNanos(instant.getNano())
				.build();
	}
}
