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
    setPersistence,
} from "firebase/auth";
import { auth, db } from "./firebase";

interface userAuthData {
    email: string;
    password: string;
    firstName: string;
}

export async function handleSignUp(data: userAuthData) {
    try {
        // Create a new user with email and password
        const userCredential: UserCredential =
            await createUserWithEmailAndPassword(
                auth,
                data.email,
                data.password
            );
        const userDocRef = doc(db, "Users", userCredential.user.uid);
        const userDataToSet = {
            firstName: data.firstName,
            //add more fields here
        };
        await setDoc(userDocRef, userDataToSet);
        console.log("signed in");
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
