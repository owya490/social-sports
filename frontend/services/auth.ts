import React, { useState } from 'react';
import {
  collection,
  doc,
  addDoc,
  setDoc,
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
    getAuth, UserCredential
  } from 'firebase/auth';
import { auth, db } from './firebase';

interface userAuthData {
  email: string,
  password: string,
  firstName: string,
}

export async function handleSignUp(data: userAuthData) {
    try {
      // Create a new user with email and password
      const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, data.email, data.password)
      const userDocRef = doc(db, 'Users', userCredential.user.uid);
      const userDataToSet = {
        firstName: data.firstName
        //add more fields here
      };
      await setDoc(userDocRef, userDataToSet)
      console.log("signed in")
    } 
      catch (error) {
      console.log("BIG MISTAKE")
    }
}