package com.functions.users.services;

import java.util.UUID;

import com.functions.users.repositories.UsernameRepository;
import com.functions.users.repositories.UsernameRepository.UsernameClaim;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Transaction;

/**
 * Builds a safe username and picks one that is free.
 */
public final class UsernameService {
	private static final String FALLBACK_USERNAME = "user";

	public record UsernameOptions(String preferred, String fallback) {
	}

	private UsernameService() {
	}

	/** "Alex Smith" becomes "alexsmith". The fallback adds _ and four characters from a UUID. */
	public static UsernameOptions usernameOptions(String displayName) {
		String preferred = sanitizeUsername(displayName);
		String fallback = preferred + "_" + UUID.randomUUID().toString().substring(0, 4);
		return new UsernameOptions(preferred, fallback);
	}

	/**
	 * Lowercase letters, numbers, hyphens, and underscores only.
	 * This keeps the username usable as a Firestore document id.
	 */
	public static String sanitizeUsername(String displayName) {
		if (displayName == null) {
			return FALLBACK_USERNAME;
		}
		String username = displayName.toLowerCase().replaceAll("[^a-z0-9_-]", "");
		return username.isEmpty() ? FALLBACK_USERNAME : username;
	}

	/**
	 * Reads the username documents and picks one. An existing profile keeps its stored username.
	 * A new profile uses the display-name username, then the fallback when that name is taken.
	 */
	public static UsernameClaim chooseUsername(Transaction transaction, String uid, DocumentSnapshot publicSnap,
			UsernameOptions usernames) throws Exception {
		String existing = publicSnap.getString("username");
		if (publicSnap.exists() && existing != null && !existing.isBlank()) {
			return UsernameRepository.verifyUsername(transaction, uid, existing);
		}
		UsernameClaim preferred = UsernameRepository.verifyUsername(transaction, uid, usernames.preferred());
		if (!preferred.taken()) {
			return preferred;
		}
		UsernameClaim fallback = UsernameRepository.verifyUsername(transaction, uid, usernames.fallback());
		if (!fallback.taken()) {
			return fallback;
		}
		throw new IllegalStateException("Could not generate a username");
	}
}
