package com.functions.Users;

import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;

import com.functions.FirebaseService;
import com.functions.FirebaseService.CollectionPaths;

public class Users {
	public static void updateUser(String userId, UserData newData) {
		Firestore db = FirebaseService.getFirestore();
		DocumentReference publicUserInfoDocRef = db.collection(CollectionPaths.USERS).document(CollectionPaths.ACTIVE)
				.collection(CollectionPaths.PUBLIC).document(userId);
		DocumentReference privateUserInfoDocRef = db.collection(CollectionPaths.USERS).document(CollectionPaths.ACTIVE)
				.collection(CollectionPaths.PRIVATE).document(userId);
		// TODO: continue from here. Need to find a way to updateDoc.
	}

	// public static void getPrivateUser
}
