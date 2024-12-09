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
		publicUserData.setProfilePicture(data.getProfilePicture());
		publicUserData.setSurname(data.getSurname());
		publicUserData.setGender(data.getGender());
		publicUserData.setDob(data.getDob());
		publicUserData.setAge(data.getAge());

		return publicUserData;
	}

	/**
	 * CAUTION: This function performs a SHALLOW copy.
	 */
	public static PrivateUserData extracPrivateUserData(UserData data) {
		PrivateUserData privateUserData = new PrivateUserData();
		privateUserData.setLocation(privateUserData.getLocation());
		privateUserData.setContactInformation(data.getContactInformation());
		privateUserData.setActiveBookings(data.getActiveBookings());
		privateUserData.setOrganiserEvents(data.getOrganiserEvents());

		return privateUserData;
	}
}
