package com.functions.RecurringEvents;

import lombok.Data;

import java.lang.Boolean;
import java.util.Map;
import java.util.List;

import com.google.protobuf.Timestamp;

@Data
public class RecurrenceData {
	private Frequency frequency;
	private Integer recurrenceAmount;
	private Integer createDaysBefore;
	private Boolean recurrenceEnabled;
	private List<Timestamp> allRecurrences;

	/**
	 * Map<Timestamp, EventId: String>
	 */
	private Map<Timestamp, String> pastRecurrences;

	public enum Frequency {
		WEEKLY(0),
		FORTNIGHTLY(1),
		MONTHLY(2);

		private final int value;

		Frequency(int value) {
			this.value = value;
		}

		public int getValue() {
			return value;
		}

		public static Frequency fromValue(int value) {
			for (Frequency freq : Frequency.values()) {
				if (freq.value == value) {
					return freq;
				}
			}
			return null;
		}
	}
}
