package com.functions.Users;

import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.functions.FirebaseService;
import com.functions.JavaUtils;
import com.functions.FirebaseService.CollectionPaths;

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

	public static PrivateUserData getPrivateUserDataById(String userId) throws Exception {
		Firestore db = FirebaseService.getFirestore();
		DocumentReference docRef = db.collection(CollectionPaths.USERS).document(CollectionPaths.ACTIVE)
				.collection(CollectionPaths.PRIVATE).document(userId);
		PrivateUserData privateUserData = docRef.get().get().toObject(PrivateUserData.class);
		return privateUserData;
	}
}
