package com.functions.users.services;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import com.fasterxml.jackson.core.type.TypeReference;
import com.functions.firebase.services.FirebaseService;
import com.functions.firebase.services.FirebaseService.CollectionPaths;
import com.functions.users.models.PrivateUserData;
import com.functions.users.models.PublicUserData;
import com.functions.users.models.UserData;
import com.functions.users.utils.UsersUtils;
import com.functions.utils.JavaUtils;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Transaction;

public class Users {

	public static void updateUser(String userId, UserData newData) {
		Firestore db = FirebaseService.getFirestore();
		DocumentReference publicUserInfoDocRef = db.collection(CollectionPaths.USERS).document(CollectionPaths.ACTIVE)
				.collection(CollectionPaths.PUBLIC).document(userId);
		DocumentReference privateUserInfoDocRef = db.collection(CollectionPaths.USERS).document(CollectionPaths.ACTIVE)
				.collection(CollectionPaths.PRIVATE).document(userId);

		PublicUserData publicUserData = UsersUtils.extractPublicUserData(newData);
		publicUserInfoDocRef.update(JavaUtils.toMap(publicUserData));

		PrivateUserData privateUserData = UsersUtils.extracPrivateUserData(newData);
		privateUserInfoDocRef.update(JavaUtils.toMap(privateUserData));
	}

	public static void updatePublicUserData(String userId, PublicUserData newData) {
		Firestore db = FirebaseService.getFirestore();
		db.collection(CollectionPaths.USERS).document(CollectionPaths.ACTIVE).collection(CollectionPaths.PUBLIC)
				.document(userId).update(JavaUtils.toMap(newData));
	}

	public static void updatePrivateUserData(String userId, PrivateUserData newData) {
		Firestore db = FirebaseService.getFirestore();
		db.collection(CollectionPaths.USERS).document(CollectionPaths.ACTIVE).collection(CollectionPaths.PRIVATE)
				.document(userId).update(JavaUtils.toMap(newData));
	}

	public static UserData getUserDataById(String userId) throws Exception {
		PublicUserData publicUserData = Users.getPublicUserDataById(userId);
		PrivateUserData privateUserData = Users.getPrivateUserDataById(userId);
		return mergeToUserData(userId, publicUserData, privateUserData);
	}

	public static PublicUserData getPublicUserDataById(String userId) throws Exception {
		Firestore db = FirebaseService.getFirestore();
		DocumentReference docRef = db.collection(CollectionPaths.USERS).document(CollectionPaths.ACTIVE)
				.collection(CollectionPaths.PUBLIC).document(userId);
		return docRef.get().get().toObject(PublicUserData.class);
	}

	public static PrivateUserData getPrivateUserDataById(String userId) throws Exception {
		return getPrivateUserDataById(userId, Optional.empty());
	}

	public static PrivateUserData getPrivateUserDataById(String userId, Optional<Transaction> transaction) throws Exception {
		Firestore db = FirebaseService.getFirestore();
		DocumentReference docRef = db.collection(CollectionPaths.USERS).document(CollectionPaths.ACTIVE)
				.collection(CollectionPaths.PRIVATE).document(userId);
		return transaction.isPresent() ? transaction.get().get(docRef).get().toObject(PrivateUserData.class) : docRef.get().get().toObject(PrivateUserData.class);
	}


		/**
	 * Merges PublicUserData and PrivateUserData into a single UserData object.
	 * Converts both objects to maps, merges them, adds userId, then converts to UserData.
	 * This approach automatically handles new fields without code changes.
	 *
	 * @param userId The user's ID
	 * @param publicData The public user data
	 * @param privateData The private user data
	 * @return The merged UserData
	 */
		private static UserData mergeToUserData(String userId, PublicUserData publicData, PrivateUserData privateData) {
			// Convert both objects to maps using Jackson (handles all fields automatically)
			Map<String, Object> publicMap = JavaUtils.objectMapper.convertValue(
					publicData, new TypeReference<Map<String, Object>>() {});
			Map<String, Object> privateMap = JavaUtils.objectMapper.convertValue(
					privateData, new TypeReference<Map<String, Object>>() {});
	
			// Merge maps (private fields added to public fields)
			Map<String, Object> mergedMap = new HashMap<>(publicMap);
			mergedMap.putAll(privateMap);
	
			// Add userId
			mergedMap.put("userId", userId);
	
			// Convert merged map to UserData
			return JavaUtils.objectMapper.convertValue(mergedMap, UserData.class);
		}
}
