package com.functions.users.services;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.mockito.Mockito.mockStatic;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.MockedStatic;

import com.functions.global.exceptions.NotFoundException;
import com.functions.users.models.AbstractUserData.ContactInformation;
import com.functions.users.models.PublicUserData;
import com.functions.users.models.responses.GetPartnerUserResponse;
import com.functions.utils.environment.Environment;
import com.functions.utils.environment.EnvironmentUtils;

public class PartnerUserServiceTest {
	private static final String ORGANISER = "organiser-1";
	private MockedStatic<Users> users;
	private MockedStatic<EnvironmentUtils> environment;

	@Before
	public void setUp() {
		users = mockStatic(Users.class);
		environment = mockStatic(EnvironmentUtils.class);
		environment.when(EnvironmentUtils::getEnvironment).thenReturn(Environment.PRODUCTION);
	}

	@After
	public void tearDown() {
		environment.close();
		users.close();
	}

	@Test
	public void returnsPublicNameBioContactUsernameAndProfileUrl() throws Exception {
		PublicUserData profile = profile("Ada", "Lovelace", "Writes programs.", "ada");
		profile.setPublicContactInformation(contact("ada@example.com", "0400000000"));
		users.when(() -> Users.getPublicUserDataById(ORGANISER)).thenReturn(profile);

		GetPartnerUserResponse response = PartnerUserService.getPublicPartnerUser(ORGANISER);

		assertEquals("Ada Lovelace", response.name());
		assertEquals("Writes programs.", response.bio());
		assertEquals("ada@example.com", response.email());
		assertEquals("0400000000", response.phone());
		assertEquals("ada", response.username());
		assertEquals("https://www.sportshub.net.au/user/ada", response.profileUrl());
	}

	@Test
	public void omitsBlankContactAndUsesTheUserIdWhenUsernameIsMissing() throws Exception {
		PublicUserData profile = profile("Ada", null, null, " ");
		profile.setPublicContactInformation(contact("  ", ""));
		users.when(() -> Users.getPublicUserDataById(ORGANISER)).thenReturn(profile);

		GetPartnerUserResponse response = PartnerUserService.getPublicPartnerUser(ORGANISER);

		assertEquals("Ada", response.name());
		assertEquals("", response.bio());
		assertNull(response.email());
		assertNull(response.phone());
		assertEquals("", response.username());
		assertEquals("https://www.sportshub.net.au/user/" + ORGANISER, response.profileUrl());
	}

	@Test
	public void hidesAMissingPublicProfile() throws Exception {
		users.when(() -> Users.getPublicUserDataById(ORGANISER)).thenReturn(null);

		try {
			PartnerUserService.getPublicPartnerUser(ORGANISER);
		} catch (NotFoundException expected) {
			return;
		}
		throw new AssertionError("Expected a missing profile to be unavailable");
	}

	private static PublicUserData profile(String firstName, String surname, String bio, String username) {
		PublicUserData profile = new PublicUserData();
		profile.setFirstName(firstName);
		profile.setSurname(surname);
		profile.setBio(bio);
		profile.setUsername(username);
		return profile;
	}

	private static ContactInformation contact(String email, String mobile) {
		ContactInformation contact = new ContactInformation();
		contact.setEmail(email);
		contact.setMobile(mobile);
		return contact;
	}
}
