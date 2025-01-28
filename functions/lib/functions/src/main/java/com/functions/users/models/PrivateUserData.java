package com.functions.users.models;

import com.functions.users.models.AbstractUserData.ActiveBooking;
import com.functions.users.models.AbstractUserData.ContactInformation;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class PrivateUserData {
	private String location;
	private ContactInformation contactInformation;
	private List<ActiveBooking> activeBookings = new ArrayList<>();
	private String stripeAccount;
	private Boolean stripeAccountActive;
	private List<String> organiserEvents = new ArrayList<>();
	private List<String> recurrenceTemplates = new ArrayList<>();
}
