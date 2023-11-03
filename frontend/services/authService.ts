import { doc, setDoc, getDoc } from "firebase/firestore";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    FacebookAuthProvider,
    UserCredential,
    signOut,
} from "firebase/auth";
import { auth, authUser, db } from "./firebase";

export interface userAuthData {
    email: string;
    password: string;
    firstName: string;
}

export async function handleEmailAndPasswordSignUp(data: userAuthData) {
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

export async function handleSignOut() {
    try {
        await signOut(auth);
    } catch (error) {
        console.log(error);
    }
}

export async function handleEmailAndPasswordSignIn(
    email: string,
    password: string
) {
    try {
        await signInWithEmailAndPassword(auth, email, password);
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
