package com.functions.users.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.Data;

/**
 * Users/Active/Metadata/{userId}. Holds the user id. Other fields stay empty for now.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class UserMetadata {
	private String userId;
}
