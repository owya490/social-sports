package com.functions.users.services;

import com.functions.users.models.PrivateUserData;
import com.functions.users.models.PublicUserData;
import com.functions.users.models.UserData;
import com.functions.users.utils.UsersUtils;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.functions.firebase.services.FirebaseService;
import com.functions.utils.JavaUtils;
import com.functions.firebase.services.FirebaseService.CollectionPaths;

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
	
	public static PublicUserData getPublicUserDataById(String userId) throws Exception {
		Firestore db = FirebaseService.getFirestore();
		DocumentReference docRef = db.collection(CollectionPaths.USERS).document(CollectionPaths.ACTIVE)
				.collection(CollectionPaths.PUBLIC).document(userId);
        return docRef.get().get().toObject(PublicUserData.class);
	}

	public static PrivateUserData getPrivateUserDataById(String userId) throws Exception {
		Firestore db = FirebaseService.getFirestore();
		DocumentReference docRef = db.collection(CollectionPaths.USERS).document(CollectionPaths.ACTIVE)
				.collection(CollectionPaths.PRIVATE).document(userId);
        return docRef.get().get().toObject(PrivateUserData.class);
	}
}
