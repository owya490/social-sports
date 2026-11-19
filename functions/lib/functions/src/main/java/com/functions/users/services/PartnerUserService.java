package com.functions.users.services;

import com.functions.global.exceptions.NotFoundException;
import com.functions.users.models.AbstractUserData.ContactInformation;
import com.functions.users.models.PublicUserData;
import com.functions.users.models.responses.GetPartnerUserResponse;
import com.functions.utils.UrlUtils;

/**
 * Public profile fields a partner site may show for its own organiser.
 * Contact details come only from the public profile.
 */
public class PartnerUserService {
	public static GetPartnerUserResponse getPublicPartnerUser(String organiserId) {
		if (organiserId == null || organiserId.isBlank()) {
			throw new IllegalArgumentException("Invalid request data");
		}
		PublicUserData user = readPublicProfile(organiserId);
		if (user == null) {
			throw new NotFoundException("User is not available");
		}
		ContactInformation contact = user.getPublicContactInformation();
		String username = blankToEmpty(user.getUsername()).trim();
		String profilePath = username.isEmpty() ? organiserId : username;
		return new GetPartnerUserResponse(
				displayName(user.getFirstName(), user.getSurname()),
				blankToEmpty(user.getBio()),
				contact == null ? null : blankToNull(contact.getEmail()),
				contact == null ? null : blankToNull(contact.getMobile()),
				username,
				profileUrl(profilePath));
	}

	private static PublicUserData readPublicProfile(String organiserId) {
		try {
			return Users.getPublicUserDataById(organiserId);
		} catch (Exception e) {
			if (e instanceof InterruptedException) {
				Thread.currentThread().interrupt();
			}
			throw new IllegalStateException("Could not load the public profile", e);
		}
	}

	private static String displayName(String firstName, String surname) {
		String first = blankToEmpty(firstName).trim();
		String last = blankToEmpty(surname).trim();
		if (first.isEmpty()) {
			return last;
		}
		if (last.isEmpty()) {
			return first;
		}
		return first + " " + last;
	}

	private static String profileUrl(String profilePath) {
		String path = "/user/" + profilePath;
		return UrlUtils.getUrlWithCurrentEnvironment(path).orElse(UrlUtils.SPORTSHUB_URL + path);
	}

	private static String blankToEmpty(String value) {
		return value == null ? "" : value;
	}

	private static String blankToNull(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}
		return value.trim();
	}
}
