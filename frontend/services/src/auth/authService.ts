import { useUser } from "@/components/utility/UserContext";
import { EmptyUserData, NewUserData, TempUserData, UserData } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import { FirebaseError } from "@firebase/util";
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
import { deleteDoc, doc, getDoc, setDoc, Transaction } from "firebase/firestore";
import { auth, db } from "../firebase";
import { UserNotFoundError } from "../users/userErrors";
import { createUser, deleteUser, getPublicUserById } from "../users/usersService";

const authServiceLogger = new Logger("authServiceLogger");

export async function handleEmailAndPasswordSignUp(data: NewUserData) {
  let userCredential; // Declare userCredential outside the try block to access it in the catch block

  try {
    // Create a new user with email and password
    userCredential = await createUserWithEmailAndPassword(auth, data.contactInformation.email, data.password);
    authServiceLogger.info("Firebase Auth Object Created", {
      email: data.contactInformation.email,
      userId: userCredential.user.uid,
    });
    const { password, ...userDataWithoutPassword } = data;
    // Save user data temporarily in your database
    await saveTempUserData(userCredential.user.uid, userDataWithoutPassword);
    authServiceLogger.info("Temp User Data Created", {
      email: data.contactInformation.email,
      userId: userCredential.user.uid,
    });
    // Send email verification
    await sendEmailVerification(userCredential.user, actionCodeSettings);
    authServiceLogger.info("Email Verification sent", {
      email: data.contactInformation.email,
      userId: userCredential.user.uid,
    });
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

export async function handleEmailAndPasswordSignIn(email: string, password: string): Promise<boolean> {
  let userCredential: UserCredential | undefined = undefined;

  try {
    // Sign in with email and passwor

    userCredential = await signInWithEmailAndPassword(auth, email, password);
    authServiceLogger.info("User Object gotten in sign in workflow", { email, userId: userCredential.user.uid });

    if (!userCredential.user.emailVerified) {
      authServiceLogger.info("Email is not verified. Sending verification email.", { userId: userCredential.user.uid });
      await sendEmailVerification(userCredential.user, actionCodeSettings);
      throw new Error("Email is not verified. We have sent another Verification Email");
    } else {
      authServiceLogger.info("Email is verified. Proceeding with login.", { userId: userCredential.user.uid });

      try {
        await getPublicUserById(userCredential.user.uid);
        return true; // User exists, sign-in successful
      } catch (error: unknown) {
        if (error instanceof UserNotFoundError) {
          authServiceLogger.info("User not found in public users. Attempting to retrieve temporary user data.", {
            userId: userCredential.user.uid,
          });

          const userData = await getTempUserData(userCredential.user.uid);

          if (userData) {
            try {
              await createUser(userData, userCredential.user.uid);
              authServiceLogger.info("Temporary user data found and user created successfully.", {
                userId: userCredential.user.uid,
              });

              // Proceed with deletion of temporary user data
              await deleteTempUserData(userCredential.user.uid);
              authServiceLogger.info("Temporary user data deleted after successful creation.", {
                userId: userCredential.user.uid,
              });
              return true; // User created and temporary data deleted successfully
            } catch (creationError) {
              authServiceLogger.error("Error during user creation. Attempting rollback.", {
                userId: userCredential.user.uid,
              });

              // Rollback only if user creation succeeded and temporary data deletion failed
              try {
                await deleteUser(userCredential.user.uid);
                authServiceLogger.error("User creation rolled back successfully.", { userId: userCredential.user.uid });
              } catch (rollbackError) {
                const rollbackErrorMessage =
                  rollbackError instanceof Error ? rollbackError.message : "Unknown error during rollback";
                authServiceLogger.error("Failed to roll back user creation:", {
                  error: rollbackErrorMessage,
                  userId: userCredential.user.uid,
                });
              }

              throw new Error("User creation failed, rolled back the changes.");
            }
          } else {
            authServiceLogger.error("Temporary user data not found after email verification.", {
              userId: userCredential.user.uid,
            });
            throw new Error("User data not found.");
          }
        } else {
          throw error; // Re-throw if it's not a UserNotFoundError
        }
      }
    }
  } catch (error: unknown) {
    if (userCredential) {
      try {
        await signOut(auth);
        authServiceLogger.info("User signed out due to an error.", { email });
      } catch (signOutError) {
        authServiceLogger.error("Failed to sign out user during error handling.", {
          error: signOutError instanceof Error ? signOutError.message : "Unknown error",
          email,
        });
      }
    }

    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";

    if (error instanceof FirebaseError) {
      authServiceLogger.error("Firebase error occurred during sign-in process.", {
        code: error.code,
        message: error.message,
        email,
      });
    } else {
      authServiceLogger.error("An error occurred during sign-in process.", { message: errorMessage, email });
    }

    throw new Error(errorMessage);
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
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    // Handle errors
    console.error("Error sending password reset email:", error);
    throw error; // Rethrow the error for the caller to handle if needed
  }
}
