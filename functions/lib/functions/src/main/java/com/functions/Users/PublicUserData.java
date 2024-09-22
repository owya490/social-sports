package com.functions.Users;

import lombok.Data;

@Data
public class PublicUserData {
	private String firstName;
	private String surname;
	private String gender;
	private String dob;
	private String age;
	private String profilePicture;
	private Boolean isVerifiedOrganiser;
}
