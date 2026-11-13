package com.functions.users.repositories;

import java.util.Map;

import com.functions.firebase.services.FirebaseService;
import com.functions.firebase.services.FirebaseService.CollectionPaths;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Transaction;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.UserRecord;

/**
 * Firebase Auth and Firestore access for user provisioning.
 */
public final class UserProvisioningRepository {
	private UserProvisioningRepository() {
	}

	public static UserRecord getAuthUser(String uid) throws Exception {
		FirebaseService.ensureInitialized();
		return FirebaseAuth.getInstance().getUser(uid);
	}

	public static <T> T runTransaction(Transaction.Function<T> work) throws Exception {
		return FirebaseService.createFirestoreTransaction(work);
	}

	public static DocumentSnapshot verifyPublicProfile(Transaction transaction, String uid) throws Exception {
		return transaction.get(userDoc(CollectionPaths.PUBLIC, uid)).get();
	}

	public static DocumentSnapshot verifyPrivateProfile(Transaction transaction, String uid) throws Exception {
		return transaction.get(userDoc(CollectionPaths.PRIVATE, uid)).get();
	}

	public static DocumentSnapshot verifyMetadata(Transaction transaction, String uid) throws Exception {
		return transaction.get(userDoc(CollectionPaths.METADATA, uid)).get();
	}

	public static void createPublicProfile(Transaction transaction, DocumentSnapshot publicSnap,
			Map<String, Object> publicData) {
		if (!publicSnap.exists()) {
			transaction.set(publicSnap.getReference(), publicData);
		}
	}

	public static void createPrivateProfile(Transaction transaction, DocumentSnapshot privateSnap,
			Map<String, Object> privateData) {
		if (!privateSnap.exists()) {
			transaction.set(privateSnap.getReference(), privateData);
		}
	}

	public static void createMetadata(Transaction transaction, DocumentSnapshot metadataSnap,
			Map<String, Object> metadata) {
		if (!metadataSnap.exists()) {
			transaction.set(metadataSnap.getReference(), metadata);
		}
	}

	private static DocumentReference userDoc(String collection, String uid) {
		Firestore db = FirebaseService.getFirestore();
		return db.collection(CollectionPaths.USERS).document(CollectionPaths.ACTIVE).collection(collection).document(uid);
	}
}
