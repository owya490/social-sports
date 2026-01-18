package com.functions.events.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.google.cloud.Timestamp;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Value
@Builder(toBuilder=true)
@NoArgsConstructor(force = true, access = AccessLevel.PRIVATE)
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
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

	/**
	 * List of reserved slots for specific email addresses.
	 * These emails will have spots automatically reserved in each recurring event.
	 */
	@Builder.Default
	List<ReservedSlot> reservedSlots = new ArrayList<>();

	public static RecurrenceData.RecurrenceDataBuilder builderFromNewRecurrenceData(NewRecurrenceData newRecurrenceData) {
		return RecurrenceData.builder()
				.frequency(newRecurrenceData.getFrequency())
				.recurrenceAmount(newRecurrenceData.getRecurrenceAmount())
				.createDaysBefore(newRecurrenceData.getCreateDaysBefore())
				.recurrenceEnabled(newRecurrenceData.getRecurrenceEnabled())
				.reservedSlots(newRecurrenceData.getReservedSlots() != null ? newRecurrenceData.getReservedSlots() : new ArrayList<>());
	}

	public NewRecurrenceData extractNewRecurrenceData() {
		NewRecurrenceData data = new NewRecurrenceData();
		data.setFrequency(this.frequency);
		data.setRecurrenceAmount(this.recurrenceAmount);
		data.setCreateDaysBefore(this.createDaysBefore);
		data.setRecurrenceEnabled(this.recurrenceEnabled);
		data.setReservedSlots(this.reservedSlots != null ? this.reservedSlots : new ArrayList<>());
		return data;
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
