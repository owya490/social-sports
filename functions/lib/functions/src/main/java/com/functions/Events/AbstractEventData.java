package com.functions.Events;

import lombok.Data;

import com.google.cloud.Timestamp;
import java.util.Map;
import java.util.List;
import java.util.Optional;

@Data
public abstract class AbstractEventData {
	private Timestamp startDate;
	private Timestamp endDate;
	private String location;
	private LocationLatLng locationLatLng;
	private Integer capacity;
	private Integer vacancy;
	private Double price;
	private String organiserId;
	private Timestamp registrationDeadline;
	private String name;
	private String description;
	private List<String> nameTokens;
	private List<String> locationTokens;
	private String image;
	private List<String> eventTags;
	private Boolean isActive;
	private Boolean isPrivate;
	private Map<String, Integer> attendees; // Maps email to ticket count
	private Map<String, AttendeesMetadata> attendeesMetadata; // Maps email to metadata
	private Integer accessCount;
	private String sport;
	private Boolean paymentsActive;
	private Optional<Boolean> stripeFeeToCustomer; // Optional field
	private Optional<Boolean> promotionalCodesEnabled; // Optional field

	@Data
	public static class LocationLatLng {
		private Integer lat;
		private Integer lng;
	}

	@Data
	public static class AttendeesMetadata {
		private List<String> names;
		private List<String> phones;
	}
}