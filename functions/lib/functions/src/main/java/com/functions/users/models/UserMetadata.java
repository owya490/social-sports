package com.functions.users.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.Data;

/**
 * Users/Active/Metadata/{userId}. Client writes are denied; the backend owns this document.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class UserMetadata {
	private String userId;
	/** Host vs participant choice. Unset until selected during onboarding. */
	private String onboardingPersona;
}
