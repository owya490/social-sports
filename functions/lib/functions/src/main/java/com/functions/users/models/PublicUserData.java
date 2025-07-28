package com.functions.users.models;

import java.util.ArrayList;
import java.util.List;

import com.functions.users.models.AbstractUserData.ContactInformation;

import lombok.Data;

/** 
 * Public User Data fields
 * NEEDS TO MATCH AbstractUserData.java AND PublicUserData in UserTypes.ts
 * REMEBER TO UPDATE UsersUtils.java
 */
@Data
public class PublicUserData {
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
	private List<String> forms = new ArrayList<>();
}
