package com.functions.users.models;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.functions.users.models.AbstractUserData.ActiveBooking;
import com.functions.users.models.AbstractUserData.ContactInformation;
import com.google.cloud.Timestamp;

import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class PrivateUserData {
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
	private Boolean sendOrganiserTicketEmails = false;
	private List<String> forms = new ArrayList<>();
	private List<String> privateEventCollections = new ArrayList<>();
	/** Host vs participant choice from onboarding (unset until chosen). Matches UserTypes.ts. */
	private String onboardingPersona;
	/** Product onboarding finished. `null` means in cohort for new signups. */
	private Timestamp onboardingCompletedAt;
	private Timestamp stripeConnectSetupCompletedAt;
	private Timestamp stripeConnectSetupSkippedAt;
	private Timestamp onboardingSkippedAt;
}
