package com.functions.users.utils;

import com.functions.users.models.PrivateUserData;
import com.functions.users.models.PublicUserData;
import com.functions.users.models.UserData;

public class UsersUtils {
	/**
	 * CAUTION: This function performs a SHALLOW copy.
	 */
	public static PublicUserData extractPublicUserData(UserData data) {
		PublicUserData publicUserData = new PublicUserData();
		publicUserData.setFirstName(data.getFirstName());
		publicUserData.setSurname(data.getSurname());
		publicUserData.setProfilePicture(data.getProfilePicture());
		publicUserData.setIsVerifiedOrganiser(data.getIsVerifiedOrganiser());
		publicUserData.setBio(data.getBio());
		publicUserData.setIsSearchable(data.getIsSearchable());
		publicUserData.setNameTokens(data.getNameTokens());
		publicUserData.setPublicContactInformation(data.getPublicContactInformation());
		publicUserData.setPublicUpcomingOrganiserEvents(data.getPublicUpcomingOrganiserEvents());
		publicUserData.setUsername(data.getUsername());

		return publicUserData;
	}

	/**
	 * CAUTION: This function performs a SHALLOW copy.
	 */
	public static PrivateUserData extracPrivateUserData(UserData data) {
		PrivateUserData privateUserData = new PrivateUserData();
		privateUserData.setGender(privateUserData.getGender());
		privateUserData.setDob(privateUserData.getDob());
		privateUserData.setAge(privateUserData.getAge());
		privateUserData.setLocation(privateUserData.getLocation());
		privateUserData.setContactInformation(data.getContactInformation());
		privateUserData.setActiveBookings(data.getActiveBookings());
		privateUserData.setStripeAccount(privateUserData.getStripeAccount());
		privateUserData.setStripeAccountActive(privateUserData.getStripeAccountActive());
		privateUserData.setOrganiserEvents(privateUserData.getOrganiserEvents());
		privateUserData.setRecurrenceTemplates(data.getRecurrenceTemplates());
		privateUserData.setSendOrganiserTicketEmails(data.getSendOrganiserTicketEmails());
		privateUserData.setForms(data.getForms());

		return privateUserData;
	}
}
