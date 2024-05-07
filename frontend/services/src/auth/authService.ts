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
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, authUser, db } from "../firebase";
import { createUser } from "../users/usersService";

const authServiceLogger = new Logger("authServiceLogger");

export async function handleEmailAndPasswordSignUp(data: NewUserData) {
  try {
    await sendEmailVerification(data.contactInformation.email);
    console.log("Verification email sent. Please check your inbox.");
  } catch (verificationError) {
    console.error("Failed to send verification email:", verificationError);
    return;
  }

  // try {
  //   await sendEmailVerification(data.contactInformation.email);
  //   // Create a new user with email and password
  //   console.log(data);
  //   const userCredential: UserCredential = await createUserWithEmailAndPassword(
  //     auth,
  //     data.contactInformation.email,
  //     data.password
  //   );
  //   console.log(userCredential.user.uid);
  //   if (userCredential.user) {
  //     // TODO: we need to check firebase auth if the user is already created, if they are, we don't recreate the user.. figure smth out
  //     createUser(data, userCredential.user.uid);
  //   } else {
  //     // Handle the case where userCredential.user is null
  //     console.error("User authentication failed");
  //   }
  // } catch (error) {
  //   throw error;
  // }
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

const actionCodeSettings = {
  // URL you want to redirect back to. The domain (www.example.com) for this
  // URL must be in the authorized domains list in the Firebase Console.
  url: "http://localhost:3000/dashboard",
  // This must be true.
  handleCodeInApp: true,
  iOS: {
    bundleId: "com.example.ios",
  },
  android: {
    packageName: "com.example.android",
    installApp: true,
    minimumVersion: "12",
  },
  dynamicLinkDomain: "http://localhost:3000/",
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

export async function sendEmailVerification(email: string): Promise<void> {
  try {
    // Send email verification first
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    // Password reset email sent successfully
    console.log(`Email Verification sent to ${email}`);
  } catch (error) {
    // Handle errors
    console.error("Error sending email verification:", error);
    throw error; // Rethrow the error for the caller to handle if needed
  }
}
