package com.functions.users.models;

import com.functions.users.models.AbstractUserData.ActiveBooking;
import com.functions.users.models.AbstractUserData.ContactInformation;
import lombok.Data;

import java.util.List;

@Data
public class PrivateUserData {
	private String location;
	private ContactInformation contactInformation;
	private List<ActiveBooking> activeBookings;
	private String stripeAccount;
	private Boolean stripeAccountActive;
	private List<String> organiserEvents;
	private List<String> recurrenceTemplates;
}
