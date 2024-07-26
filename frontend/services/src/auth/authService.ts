import { EmptyUserData, NewUserData, TempUserData, UserData } from "@/interfaces/UserTypes";
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
  deleteUser,
} from "firebase/auth";
import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, authUser, db } from "../firebase";
import { createUser, getPublicUserById } from "../users/usersService";
import { verify } from "crypto";
import { CodeBracketIcon } from "@heroicons/react/24/outline";
import { FirebaseError } from "@firebase/util";
import { isInstanceOf } from "@grafana/faro-web-sdk";
import { UserNotFoundError } from "../users/userErrors";

const authServiceLogger = new Logger("authServiceLogger");

export async function handleEmailAndPasswordSignUp(data: NewUserData) {
  let userCredential; // Declare userCredential outside the try block to access it in the catch block

  try {
    // Create a new user with email and password
    userCredential = await createUserWithEmailAndPassword(auth, data.contactInformation.email, data.password);

    // Send email verification
    await sendEmailVerification(userCredential.user, actionCodeSettings);
    console.log("Email verification sent. Please verify your email before logging in.");
    const { password, ...userDataWithoutPassword } = data;
    // Save user data temporarily in your database
    await saveTempUserData(userCredential.user.uid, userDataWithoutPassword);
  } catch (error) {
    console.error("Error during sign-up:", error);
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
    const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("isverified", userCredential.user.emailVerified);
    // Check if the user's email is verified
    if (userCredential.user.emailVerified) {
      console.log("Email is verified. Logging in...");

      try {
        const userExist = await getPublicUserById(userCredential.user.uid);
        return true;
      } catch (error: unknown) {
        // Retrieve the temporary user data
        if (error instanceof UserNotFoundError) {
          const userData = await getTempUserData(userCredential.user.uid);
          // Handle user creation if temporary user data exists
          if (userData) {
            await createUser(userData, userCredential.user.uid);
            deleteTempUserData(userCredential.user.uid);
            return true;
          } else {
            console.error("User data not found after email verification.");
            throw new Error("User data not found.");
          }
        }
      }
    } else {
      console.error("Email is not verified. Please verify your email before logging in.");
      await sendEmailVerification(userCredential.user, actionCodeSettings);
      throw new Error("Email is not verified. We have sent another Verification Email");
    }
  } catch (error: unknown) {
    if (error instanceof FirebaseError) {
      throw new Error(error.code);
    }
    if (error instanceof Error) {
      throw new Error(error.message);
    }
  }
}

export async function saveTempUserData(userId: string, data: TempUserData) {
  await setDoc(doc(db, "TempUsers", userId), data);
}

export async function getTempUserData(userId: string): Promise<NewUserData | null> {
  const docRef = doc(db, "TempUsers", userId); // Get a reference to the document
  const docSnap = await getDoc(docRef); // Retrieve the document snapshot

  if (docSnap.exists()) {
    return docSnap.data() as NewUserData;
  } else {
    return null;
  }
}

async function deleteTempUserData(userId: string) {
  await deleteDoc(doc(db, "TempUsers", userId));
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
  url: "https://www.sportshub.net.au/login",
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
