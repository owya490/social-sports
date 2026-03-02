package com.functions.events.models;

import java.util.List;
import java.util.Map;

import javax.annotation.Nullable;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.functions.utils.JavaUtils;
import com.google.cloud.Timestamp;

import lombok.Data;


/**
 * NOTE: This type should be updated to match the AbstractEventData interface `frontend/interfaces/EventTypes.ts`
 */
@Data
public abstract class AbstractEventData {
	@JsonSerialize(using = JavaUtils.TimestampSerializer.class)
	@JsonDeserialize(using = JavaUtils.TimestampDeserializer.class)
	private Timestamp startDate;
	@JsonSerialize(using = JavaUtils.TimestampSerializer.class)
	@JsonDeserialize(using = JavaUtils.TimestampDeserializer.class)
	private Timestamp endDate;
	private String location;
	private LocationLatLng locationLatLng;
	private Integer capacity;
	private Integer vacancy;
	/**
	 * Price in cents
	 */
	private Integer price;
	private String organiserId;
	@JsonSerialize(using = JavaUtils.TimestampSerializer.class)
	@JsonDeserialize(using = JavaUtils.TimestampDeserializer.class)
	private Timestamp registrationDeadline;
	private String name;
	private String description;
	private List<String> nameTokens;
	private List<String> locationTokens;
	private String image;
	@Nullable
	private String thumbnail;
	private List<String> eventTags;
	private Boolean isActive;
	private Boolean isPrivate;
	private Map<String, Integer> attendees; // Maps email to ticket count
	private Map<String, AttendeesMetadata> attendeesMetadata; // Maps email to metadata
	private Integer accessCount;
	private String sport;
	private Boolean paymentsActive;
	@Nullable
	private Boolean stripeFeeToCustomer; // Optional field
	@Nullable
	private Boolean promotionalCodesEnabled; // Optional field
	private Boolean paused;
	@Nullable
	private String eventLink;
	@Nullable
	private String formId;
	private Boolean hideVacancy; // Optional field
	private Boolean waitlistEnabled = true; // Default to true
	private Boolean bookingApprovalEnabled = false; // Optional field
	private Boolean showAttendeesOnEventPage = false; // Optional field

	@Data
	public static class LocationLatLng {
		private Double lat;
		private Double lng;
	}

	@Data
	public static class AttendeesMetadata {
		private List<String> names;
		private List<String> phones;
	}
}