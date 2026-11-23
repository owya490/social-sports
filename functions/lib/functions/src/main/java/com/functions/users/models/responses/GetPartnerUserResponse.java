package com.functions.users.models.responses;

import javax.annotation.Nullable;

public record GetPartnerUserResponse(
		String name,
		String bio,
		@Nullable String email,
		@Nullable String phone,
		String username,
		String profileUrl) {}
