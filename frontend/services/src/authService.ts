import { EmptyUserData, NewUserData, UserData, userAuthData } from "@/interfaces/UserTypes";
import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  UserCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, authUser, db } from "./firebase";
import { createUser } from "./users/usersService";
import { create } from "domain";

export async function handleEmailAndPasswordSignUp(data: NewUserData) {
  try {
    // Create a new user with email and password
    console.log(data);
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth,
      data.contactInformation.email,
      data.password
    );
    console.log("herererere");
    console.log(userCredential.user.uid);
    if (userCredential.user) {
      createUser(data, userCredential.user.uid);
    } else {
      // Handle the case where userCredential.user is null
      console.error("User authentication failed");
    }
    // createUser(data,userCredential.user.uid);
    // const userDocRef = doc(db, "Users", userCredential.user.uid);
    // const userDataToSet = {
    //   firstName: data.firstName,
    //   contactInformation: { email: data.email },

    //   //add more fields here
    // };
    // await setDoc(userDocRef, userDataToSet);
    // console.log("signed in", userCredential);
  } catch (error) {
    throw error;
  }
}

export async function handleSignOut(setUser: (user: UserData) => void) {
  try {
    await signOut(auth);
    setUser(EmptyUserData);
    console.log("Signed out!");
  } catch (error) {
    throw error;
  }
}

export async function handleEmailAndPasswordSignIn(email: string, password: string) {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    throw error;
  }
}

export async function handleGoogleSignIn() {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential: UserCredential = await signInWithPopup(auth, provider);
    const userDocRef = doc(db, "Users", userCredential.user.uid);

    // Check if the user already exists in your Firestore collection,
    // and create a new document if not.
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      const userDataToSet = {
        firstName: userCredential.user.displayName,
        // TODO: add more fields here
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
    const userCredential: UserCredential = await signInWithPopup(auth, provider);
    const userDocRef = doc(db, "Users", userCredential.user.uid);

    // Check if the user already exists in your Firestore collection,
    // and create a new document if not.
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      const userDataToSet = {
        firstName: userCredential.user.displayName,
        // TODO: add more fields here
      };
      await setDoc(userDocRef, userDataToSet);
    }

    console.log("Facebook signed in");
  } catch (error) {
    console.log(error);
  }
}

/**
 * Utility function determining whether any user is logged in or not.
 * @returns boolean
 */
export function isLoggedIn(): boolean {
  return authUser !== null;
}
