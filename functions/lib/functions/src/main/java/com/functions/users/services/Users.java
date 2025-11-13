package com.functions.users.services;

import java.lang.StackWalker.Option;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.functions.firebase.services.FirebaseService;
import com.functions.firebase.services.FirebaseService.CollectionPaths;
import com.functions.users.models.PrivateUserData;
import com.functions.users.models.PublicUserData;
import com.functions.users.models.UserData;
import com.functions.users.utils.UsersUtils;
import com.functions.utils.JavaUtils;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Transaction;

public class Users {
	private static final Logger logger = LoggerFactory.getLogger(Users.class);


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
	
	public static PublicUserData getPublicUserDataById(String userId) throws Exception {
		return getPublicUserDataById(userId, Optional.empty());
	}
	
	public static PublicUserData getPublicUserDataById(String userId, Optional<Transaction> transaction) throws Exception {
		Firestore db = FirebaseService.getFirestore();
		DocumentReference docRef = db.collection(CollectionPaths.USERS).document(CollectionPaths.ACTIVE)
				.collection(CollectionPaths.PUBLIC).document(userId);

		DocumentSnapshot maybeUserData;
		if (transaction.isPresent()) {
			maybeUserData = transaction.get().get(docRef).get();
		} else {
			maybeUserData = docRef.get().get();
		}
		if (maybeUserData.exists()) {
			return maybeUserData.toObject(PublicUserData.class);
		}
		logger.error("No public user document found for userId: {}", userId);
		throw new Exception("No public user document found for userId: " + userId);
	}

	public static PrivateUserData getPrivateUserDataById(String userId) throws Exception {
		return getPrivateUserDataById(userId, Optional.empty());
	}

	public static PrivateUserData getPrivateUserDataById(String userId, Optional<Transaction> transaction) throws Exception {
		Firestore db = FirebaseService.getFirestore();
		DocumentReference docRef = db.collection(CollectionPaths.USERS).document(CollectionPaths.ACTIVE)
				.collection(CollectionPaths.PRIVATE).document(userId);
		
		DocumentSnapshot maybeUserData;
		if (transaction.isPresent()) {
			maybeUserData = transaction.get().get(docRef).get();
		} else {
			maybeUserData = docRef.get().get();
		}
		if (maybeUserData.exists()) {
			return maybeUserData.toObject(PrivateUserData.class);
		}
		logger.error("No private user document found for userId: {}", userId);
		throw new Exception("No private user document found for userId: " + userId);
	}
}
