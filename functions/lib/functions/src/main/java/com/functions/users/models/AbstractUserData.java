package com.functions.users.models;

import lombok.Data;

import java.lang.Boolean;
import java.util.ArrayList;
import java.util.List;

@Data
public abstract class AbstractUserData {
	/** 
	 * Public User Data fields
	 * NEEDS TO MATCH PublicUserData.java and PublicUserData in UserTypes.ts
	 */
	private String firstName;
	private String surname;
	private String profilePicture;
	private Boolean isVerifiedOrganiser;
	private String bio;
	private Boolean isSearchable;
	private List<String> nameTokens = new ArrayList<>();
	private ContactInformation publicContactInformation;
	private List<String> publicUpcomingOrganiserEvents = new ArrayList<>();
	private String username;

	/** 
	 * Private User Data fields
	 * NEEDS TO MATCH PrivateUserData.java AND PrivateUserData in UserTypes.ts
	 */
	private String gender;
	private String dob;
	private String age;
	private String location;
	private ContactInformation contactInformation;
	private List<ActiveBooking> activeBookings = new ArrayList<>();
	private String stripeAccount;
	private Boolean stripeAccountActive;
	private List<String> organiserEvents = new ArrayList<>();
	private List<String> recurrenceTemplates = new ArrayList<>();
	private List<String> publicOrganiserEvents = new ArrayList<>();
	private Boolean sendOrganiserTicketEmails = false;
	private List<String> forms = new ArrayList<>();

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
