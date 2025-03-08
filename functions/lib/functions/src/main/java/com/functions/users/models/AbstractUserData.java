package com.functions.users.models;

import lombok.Data;

import java.lang.Boolean;
import java.util.List;

@Data
public abstract class AbstractUserData {
	private String firstName;
	private String surname;
	private String location;
	private String gender;
	private String dob;
	private String age;
	private ContactInformation contactInformation;
	private List<ActiveBooking> activeBookings;
	private String profilePicture;
	private String stripeAccount;
	private Boolean stripeAccountActive;
	private List<String> organiserEvents;
	private List<String> recurrenceTemplates;
	private Boolean isVerifiedOrganiser;
	private List<String> forms;

	@Data
	public static class ContactInformation {
		private String mobile;
		private String email;
	}

	@Data
	public static class ActiveBooking {
		private String eventId;
	}
}
