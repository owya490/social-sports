package com.functions.events.models;

import com.google.cloud.Timestamp;
import lombok.Builder;
import lombok.Getter;
import lombok.Value;

import java.util.List;
import java.util.Map;

@Value
@Builder(toBuilder=true)
public class RecurrenceData {
	RecurrenceData.Frequency frequency;
	Integer recurrenceAmount;
	Integer createDaysBefore;
	Boolean recurrenceEnabled;
	List<Timestamp> allRecurrences;

	/**
	 * Map<Timestamp: String, EventId: String>
	 */
	Map<String, String> pastRecurrences;

	public static RecurrenceData.RecurrenceDataBuilder builderFromNewRecurrenceData(NewRecurrenceData newRecurrenceData) {
		return RecurrenceData.builder()
				.frequency(newRecurrenceData.getFrequency())
				.recurrenceAmount(newRecurrenceData.getRecurrenceAmount())
				.createDaysBefore(newRecurrenceData.getCreateDaysBefore())
				.recurrenceEnabled(newRecurrenceData.getRecurrenceEnabled());
	}

	@Getter
	public enum Frequency {
		WEEKLY(7),
		FORTNIGHTLY(14),
		MONTHLY(30);

		private final int value;

		Frequency(int value) {
			this.value = value;
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
