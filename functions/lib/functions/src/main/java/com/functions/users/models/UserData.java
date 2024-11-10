package com.functions.users.models;

import com.functions.users.models.AbstractUserData;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class UserData extends AbstractUserData {
	private String userId;
}
