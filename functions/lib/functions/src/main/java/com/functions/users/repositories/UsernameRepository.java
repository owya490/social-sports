package com.functions.users.repositories;

import java.util.Map;

import com.functions.firebase.services.FirebaseService;
import com.functions.firebase.services.FirebaseService.CollectionPaths;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Transaction;

/**
 * Firestore access for username reservations.
 */
public final class UsernameRepository {
	private UsernameRepository() {
	}

	public record UsernameClaim(String name, DocumentReference reference, DocumentSnapshot snapshot, boolean taken) {
	}

	/** Reads one username document. Taken means another user already owns it. */
	public static UsernameClaim verifyUsername(Transaction transaction, String uid, String username) throws Exception {
		UsernameClaim claim = readUsername(transaction, username);
		boolean taken = claim.snapshot().exists() && !uid.equals(claim.snapshot().getString("userId"));
		return new UsernameClaim(claim.name(), claim.reference(), claim.snapshot(), taken);
	}

	public static void createUsername(Transaction transaction, UsernameClaim username, String uid) {
		if (!username.snapshot().exists()) {
			transaction.set(username.reference(), Map.of("userId", uid));
		}
	}

	private static UsernameClaim readUsername(Transaction transaction, String username) throws Exception {
		DocumentReference reference = FirebaseService.getFirestore().collection(CollectionPaths.USERNAMES)
				.document(username);
		return new UsernameClaim(username, reference, transaction.get(reference).get(), false);
	}
}
