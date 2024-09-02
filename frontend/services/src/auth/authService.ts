import { useUser } from "@/components/utility/UserContext";
import { EmptyUserData, NewUserData, TempUserData, UserData } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import { FirebaseError } from "firebase/app";
import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  UserCredential,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { UserNotFoundError } from "../users/userErrors";
import { createUser, getPublicUserById } from "../users/usersService";

const authServiceLogger = new Logger("authServiceLogger");

export async function handleEmailAndPasswordSignUp(data: NewUserData) {
  let userCredential; // Declare userCredential outside the try block to access it in the catch block

  try {
    // Create a new user with email and password
    userCredential = await createUserWithEmailAndPassword(auth, data.contactInformation.email, data.password);

    // Send email verification
    await sendEmailVerification(userCredential.user, actionCodeSettings);
    authServiceLogger.info(`Email sent ${userCredential.user}`);

    const { password, ...userDataWithoutPassword } = data;
    // Save user data temporarily in your database
    await saveTempUserData(userCredential.user.uid, userDataWithoutPassword);
    authServiceLogger.info(`Temp User data ${userCredential.user.uid}:${userDataWithoutPassword}`);
  } catch (error) {
    console.error("Error during sign-up:", error);
    throw error;
  }
}

export async function handleSignOut(setUser: (user: UserData) => void) {
  try {
    await signOut(auth);
    setUser(EmptyUserData);
    authServiceLogger.info("Logged out");
  } catch (error) {
    throw error;
  }
}

export async function handleEmailAndPasswordSignIn(email: string, password: string) {
  try {
    const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
    // Check if the user's email is verified
    if (userCredential.user.emailVerified) {
      authServiceLogger.info("User's email is verified");
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
  try {
    const docRef = doc(db, "TempUsers", userId); // Get a reference to the document
    const docSnap = await getDoc(docRef); // Retrieve the document snapshot

    if (docSnap.exists()) {
      return docSnap.data() as NewUserData;
    } else {
      console.error(`User ID=${userId} did not exist when expected by reference.`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching user data for ID=${userId}:`, error);
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
    authServiceLogger.info("Google signed in");
  } catch (error) {
    console.error(`Error: ${error}`);
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
    authServiceLogger.info("Facebook signed in");
  } catch (error) {
    console.error(`Error: ${error}`);
  }
}

/**
 * Utility function determining whether any user is logged in or not.
 * @returns boolean
 */
export function isLoggedIn(): boolean {
  const user = useUser();
  return useUser() !== null;
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
    authServiceLogger.info(`Password reset email sent to ${email}`);
  } catch (error) {
    // Handle errors
    console.error("Error sending password reset email:", error);
    throw error; // Rethrow the error for the caller to handle if needed
  }
}
