package com.functions.users.provisioning;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.users.models.AbstractUserData.ContactInformation;
import com.functions.users.models.PrivateUserData;
import com.functions.users.models.PublicUserData;
import com.functions.users.models.UserMetadata;
import com.functions.users.repositories.UsernameRepository;
import com.functions.users.repositories.UsernameRepository.UsernameClaim;
import com.functions.users.repositories.UserProvisioningRepository;
import com.functions.users.services.UsernameService;
import com.functions.users.services.UsernameService.UsernameOptions;
import com.functions.utils.JavaUtils;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.firebase.auth.UserInfo;
import com.google.firebase.auth.UserRecord;

/**
 * Creates the Firestore profile for a verified Auth user.
 * Each document is verified, then created, inside one transaction.
 */
public final class UserProvisioningService {
	private static final Logger logger = LoggerFactory.getLogger(UserProvisioningService.class);
	private static final String DEFAULT_PROFILE_PICTURE = "https://firebasestorage.googleapis.com/v0/b/socialsports-44162.appspot.com/o/users%2Fgeneric%2Fgeneric-profile-photo.webp?alt=media&token=15ca6518-e159-4c46-8f68-c445df11888c";
	private static final String FALLBACK_NAME = "User";

	private UserProvisioningService() {
	}

	public static String provision(String uid) throws Exception {
		try {
			UserRecord authUser = UserProvisioningRepository.getAuthUser(uid);
			if (!authUser.isEmailVerified()) {
				throw new IllegalArgumentException("Email is not verified");
			}
			if (authUser.getEmail() == null || authUser.getEmail().isBlank()) {
				throw new IllegalArgumentException("Email is required");
			}

			String displayName = displayName(authUser);
			UsernameOptions usernames = UsernameService.usernameOptions(displayName);
			Map<String, Object> privateData = toFirestoreMap(privateProfile(authUser.getEmail()));
			Map<String, Object> metadata = toFirestoreMap(metadata(uid));

			// One transaction. Every read finishes before the creation steps write.
			UserProvisioningRepository.runTransaction(transaction -> {
				// Step 1a. Verify the public profile.
				DocumentSnapshot publicSnap = UserProvisioningRepository.verifyPublicProfile(transaction, uid);
				logger.info("Step 1a succeeded {}", uid);
				// Step 2a. Verify the private profile.
				DocumentSnapshot privateSnap = UserProvisioningRepository.verifyPrivateProfile(transaction, uid);
				logger.info("Step 2a succeeded {}", uid);
				// Step 3a. Verify the metadata.
				DocumentSnapshot metadataSnap = UserProvisioningRepository.verifyMetadata(transaction, uid);
				logger.info("Step 3a succeeded {}", uid);
				// Step 4a. Choose the username.
				UsernameClaim usernameClaim = UsernameService.chooseUsername(transaction, uid, publicSnap, usernames);
				logger.info("Step 4a succeeded {}", uid);

				// Step 1b. Reserve the username so another account cannot take it.
				UsernameRepository.createUsername(transaction, usernameClaim, uid);
				logger.info("Step 1b succeeded {}", uid);
				// Step 2b. Create the public profile, including the chosen username.
				UserProvisioningRepository.createPublicProfile(transaction, publicSnap,
						toFirestoreMap(publicProfile(displayName, usernameClaim.name(), authUser.getPhotoUrl())));
				logger.info("Step 2b succeeded {}", uid);
				// Step 3b. Create the private profile, including the account email.
				UserProvisioningRepository.createPrivateProfile(transaction, privateSnap, privateData);
				logger.info("Step 3b succeeded {}", uid);
				// Step 4b. Create metadata. A null onboarding time sends the new account into onboarding.
				UserProvisioningRepository.createMetadata(transaction, metadataSnap, metadata);
				logger.info("Step 4b succeeded {}", uid);
				return null;
			});
			logger.info("User Provisioned Successfully {}", uid);
			return uid;
		} catch (Exception e) {
			logger.error("User provisioning failed {}", uid, e);
			throw e;
		}
	}

	private static String displayName(UserRecord authUser) {
		String name = authUser.getDisplayName();
		if (name == null || name.isBlank()) {
			return FALLBACK_NAME;
		}
		name = name.trim();
		if (!isGoogleUser(authUser)) {
			return name;
		}
		int space = name.indexOf(' ');
		return space == -1 ? name : name.substring(0, space);
	}

	private static boolean isGoogleUser(UserRecord authUser) {
		for (UserInfo provider : authUser.getProviderData()) {
			if ("google.com".equals(provider.getProviderId())) {
				return true;
			}
		}
		return false;
	}

	private static PublicUserData publicProfile(String displayName, String username, String photoUrl) {
		PublicUserData profile = new PublicUserData();
		profile.setFirstName(displayName);
		profile.setSurname("");
		profile.setProfilePicture(photoUrl == null || photoUrl.isBlank() ? DEFAULT_PROFILE_PICTURE : photoUrl);
		profile.setIsVerifiedOrganiser(false);
		profile.setBio("");
		profile.setIsSearchable(false);
		profile.setNameTokens(List.of(displayName.toLowerCase().split(" ")));
		ContactInformation contact = new ContactInformation();
		contact.setMobile("");
		contact.setEmail("");
		profile.setPublicContactInformation(contact);
		profile.setUsername(username);
		return profile;
	}

	private static PrivateUserData privateProfile(String email) {
		PrivateUserData profile = new PrivateUserData();
		profile.setGender("");
		profile.setDob("");
		profile.setAge("");
		profile.setLocation("");
		ContactInformation contact = new ContactInformation();
		contact.setMobile("");
		contact.setEmail(email);
		profile.setContactInformation(contact);
		profile.setSendOrganiserTicketEmails(false);
		// Explicit null marks a new account as still in onboarding. Older accounts omit the field.
		profile.setOnboardingCompletedAt(null);
		return profile;
	}

	private static UserMetadata metadata(String uid) {
		UserMetadata metadata = new UserMetadata();
		metadata.setUserId(uid);
		return metadata;
	}

	/** Writes every field on the model. Nested objects become maps so a new field is stored as-is. */
	private static Map<String, Object> toFirestoreMap(Object model) {
		Map<String, Object> map = new HashMap<>();
		JavaUtils.toMap(model).forEach((key, value) -> map.put(key, firestoreValue(value)));
		return map;
	}

	private static Object firestoreValue(Object value) {
		if (value instanceof List<?> list) {
			List<Object> values = new ArrayList<>();
			for (Object item : list) {
				values.add(firestoreValue(item));
			}
			return values;
		}
		if (value instanceof Map<?, ?> map) {
			Map<String, Object> nested = new HashMap<>();
			map.forEach((key, item) -> nested.put(String.valueOf(key), firestoreValue(item)));
			return nested;
		}
		if (value == null || value instanceof String || value instanceof Number || value instanceof Boolean
				|| value instanceof Timestamp) {
			return value;
		}
		return toFirestoreMap(value);
	}
}
