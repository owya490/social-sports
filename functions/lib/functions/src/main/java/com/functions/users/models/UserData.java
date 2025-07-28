package com.functions.users.models;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class UserData extends AbstractUserData {
	private String userId;
}
