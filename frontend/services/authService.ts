import React, { useState } from "react";
import {
    collection,
    doc,
    addDoc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
} from "firebase/firestore";
import {
    createUserWithEmailAndPassword,
    updateProfile,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    FacebookAuthProvider,
    getAuth,
    UserCredential,
} from "firebase/auth";
import { auth, db } from "./firebase";

interface userAuthData {
    email: string;
    password: string;
}

interface userInfoData {
    firstName: string;
}

export async function handleSignUp(
    loginData: userAuthData,
    userInfo: userInfoData
) {
    try {
        // Create a new user with email and password
        const userCredential: UserCredential =
            await createUserWithEmailAndPassword(
                auth,
                loginData.email,
                loginData.password
            );
        const userDocRef = doc(db, "Users", userCredential.user.uid);
        const userDataToSet = {
            firstName: userInfo.firstName,
            //add more fields here
        };
        await setDoc(userDocRef, userDataToSet);
        console.log("signed in", userCredential);
    } catch (error) {
        console.log(error);
    }
}

export async function handleLogin(data: userAuthData) {
    try {
        const userCredential: UserCredential = await signInWithEmailAndPassword(
            auth,
            data.email,
            data.password
        );

        // Optional: Fetch additional user details from Firestore if needed
        const userDocRef = doc(db, "Users", userCredential.user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            console.log("User details:", userDoc.data());
        }

        console.log("Successfully logged in", userCredential);
    } catch (error) {
        console.log(error);
    }
}

export async function handleGoogleSignIn() {
    try {
        const provider = new GoogleAuthProvider();
        const userCredential: UserCredential = await signInWithPopup(
            auth,
            provider
        );
        const userDocRef = doc(db, "Users", userCredential.user.uid);

        // Check if the user already exists in your Firestore collection,
        // and create a new document if not.
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
            const userDataToSet = {
                firstName: userCredential.user.displayName || "John", // Use a default name if Google doesn't provide one
                // add more fields here
            };
            await setDoc(userDocRef, userDataToSet);
        }

        console.log("Google signed in");
    } catch (error) {
        console.log(error);
    }
}

export async function handleFacebookSignIn() {
    try {
        const provider = new FacebookAuthProvider();
        const userCredential: UserCredential = await signInWithPopup(
            auth,
            provider
        );
        const userDocRef = doc(db, "Users", userCredential.user.uid);

        // Check if the user already exists in your Firestore collection,
        // and create a new document if not.
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
            const userDataToSet = {
                firstName: userCredential.user.displayName || "John", // Use a default name if Facebook doesn't provide one
                // add more fields here
            };
            await setDoc(userDocRef, userDataToSet);
        }

        console.log("Facebook signed in");
    } catch (error) {
        console.log(error);
    }
}
