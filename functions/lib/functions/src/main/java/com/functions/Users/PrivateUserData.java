package com.functions.Users;

import java.util.List;

import com.functions.Users.AbstractUserData.ActiveBooking;
import com.functions.Users.AbstractUserData.ContactInformation;

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
