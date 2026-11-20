package com.functions.users.models;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.google.cloud.Timestamp;

import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
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
	private List<String> publicEventCollections = new ArrayList<>();
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
	/** Organiser Pyng site id. */
	private String pyngSiteId;
	private List<String> organiserEvents = new ArrayList<>();
	private List<String> recurrenceTemplates = new ArrayList<>();
	private Boolean sendOrganiserTicketEmails = false;
	private List<String> forms = new ArrayList<>();
	private List<String> privateEventCollections = new ArrayList<>();
	/** True until onboarding is finished. Missing means false. */
	private Boolean isOnboarding;
	/** Kept for migration. New persona choices are stored on UserMetadata. */
	private String onboardingPersona;
	/** Kept for migration. Product onboarding now uses isOnboarding. */
	private Timestamp onboardingCompletedAt;
	/** Kept for migration. */
	private Timestamp stripeConnectSetupCompletedAt;
	/** Kept for migration. */
	private Timestamp stripeConnectSetupSkippedAt;
	/** Kept for migration. */
	private Timestamp onboardingSkippedAt;
	@Data
	@JsonIgnoreProperties(ignoreUnknown = true)
	public static class ContactInformation {
		private String mobile;
		private String email;
	}

	@Data
	@JsonIgnoreProperties(ignoreUnknown = true)
	public static class ActiveBooking {
		private String eventId;
	}
}
