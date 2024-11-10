package com.functions.users.models;

import java.util.List;

import com.functions.users.models.AbstractUserData.ActiveBooking;
import com.functions.users.models.AbstractUserData.ContactInformation;

import lombok.Data;

@Data
public class PrivateUserData {
	private String location;
	private ContactInformation contactInformation;
	private List<ActiveBooking> activeBookings;
	private String stripeAccount;
	private Boolean stripeAccountActive;
	private List<String> organiserEvents;
}
