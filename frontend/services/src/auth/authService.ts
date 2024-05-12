import { EmptyUserData, NewUserData, UserData } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  UserCredential,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  getAuth,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  sendEmailVerification,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, authUser, db } from "../firebase";
import { createUser } from "../users/usersService";
import { verify } from "crypto";
import { CodeBracketIcon } from "@heroicons/react/24/outline";

const authServiceLogger = new Logger("authServiceLogger");

export async function handleEmailAndPasswordSignUp(data: NewUserData) {
  try {
    // Create a new user with email and password
    console.log(data);
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth,
      data.contactInformation.email,
      data.password
    );
    console.log(auth.currentUser?.emailVerified);
    await sendEmailVerification(userCredential.user, actionCodeSettings);
    console.log("Email verification sent");

    // Wait for the authentication state to change with a timeout of 30 minutes
    await waitForEmailVerification(); // 30 minutes in milliseconds

    // Once the email is verified, proceed with user creation
    if (auth.currentUser?.emailVerified) {
      try {
        if (userCredential.user) {
          // TODO: Handle user creation
          createUser(data, userCredential.user.uid);
        } else {
          console.error("User authentication failed");
        }
      } catch (error) {
        throw error;
      }
    }
  } catch (error) {
    throw error;
  }
}

// Function to wait for authentication state change with a timeout
async function waitForEmailVerification() {
  return new Promise<void>((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged(() => {
      if (auth.currentUser && auth.currentUser.emailVerified) {
        console.log("verified");
        unsubscribe(); // Stop listening
        resolve();
      }
    });
  });
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
    console.log(auth.currentUser?.emailVerified);
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

const actionCodeSettings = {
  // URL you want to redirect back to. The domain (www.example.com) for this
  // URL must be in the authorized domains list in the Firebase Console.
  url: "http://localhost:3000/register/emailVerification",
};

export async function resetUserPassword(email: string): Promise<void> {
  try {
    // Send password reset email
    sendPasswordResetEmail(auth, email);
    // Password reset email sent successfully
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    // Handle errors
    console.error("Error sending password reset email:", error);
    throw error; // Rethrow the error for the caller to handle if needed
  }
}

// export async function sendEmailVerification(email: string): Promise<void> {
//   try {
//     // Send email verification first
//     await sendSignInLinkToEmail(auth, email, actionCodeSettings);
//     // Password reset email sent successfully
//     console.log(`Email Verification sent to ${email}`);
//   } catch (error) {
//     // Handle errors
//     console.error("Error sending email verification:", error);
//     throw error; // Rethrow the error for the caller to handle if needed
//   }
// }
