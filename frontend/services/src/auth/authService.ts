import { EmptyUserData, NewUserData, UserData, UserId } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import { FirebaseError } from "@firebase/util";
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  FacebookAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateEmail,
  UserCredential,
  verifyBeforeUpdateEmail,
} from "firebase/auth";
import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { bustEventsLocalStorageCache } from "../events/eventsUtils/getEventsUtils";
import { auth, db } from "../firebase";
import { UserNotFoundError } from "../users/userErrors";
import { createUser, deleteUser, getPublicUserById, updateUser } from "../users/usersService";
import { bustUserLocalStorageCache } from "../users/usersUtils/getUsersUtils";

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
    const userId = userCredential.user.uid;
    await saveTempUserData(userId, { ...userDataWithoutPassword, userId: userId });
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
    console.log("Signing out...");
    await signOut(auth);
    bustEventsLocalStorageCache();
    bustUserLocalStorageCache();
    setUser(EmptyUserData);
    console.log("Signed out!");
  } catch (error) {
    throw error;
  }
}

export async function handleEmailAndPasswordSignIn(email: string, password: string): Promise<UserId | null> {
  let userCredential: UserCredential | undefined = undefined;

  try {
    // Sign in with email and password

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

        // Sync email if there's a mismatch between Firebase Auth and Firestore
        // This handles cases where user changed email and logged back in
        await syncEmailOnLogin(userCredential.user.uid, userCredential.user.email);

        return userCredential.user.uid; // User exists, sign-in successful
      } catch (error: unknown) {
        if (error instanceof UserNotFoundError) {
          authServiceLogger.info("User not found in public users. Attempting to retrieve temporary user data.", {
            userId: userCredential.user.uid,
          });

          const userData = await getTempUserData(userCredential.user.uid);

          if (userData !== null) {
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
              return userCredential.user.uid; // User created and temporary data deleted successfully
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
        authServiceLogger.info(`User signed out due to an error ${error}`, { email });
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

export async function saveTempUserData(userId: string, data: UserData) {
  await setDoc(doc(db, "TempUsers", userId), data);
}

export async function getTempUserData(userId: string): Promise<UserData | null> {
  try {
    const docRef = doc(db, "TempUsers", userId); // Get a reference to the document
    const docSnap = await getDoc(docRef); // Retrieve the document snapshot

    if (docSnap.exists()) {
      return docSnap.data() as UserData;
    } else {
      authServiceLogger.error(`User ID=${userId} did not exist when expected by reference.`);
      return null;
    }
  } catch (error) {
    authServiceLogger.error(`Error fetching user data for ID=${userId}: ${error}`);
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
    authServiceLogger.info(`${error}`);
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
    authServiceLogger.info(`${error}`);
  }
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
    authServiceLogger.error(`Error sending password reset email: ${error}`);
    throw error; // Rethrow the error for the caller to handle if needed
  }
}

/**
 * Updates the user's email address with verification
 * Requires re-authentication for security
 * @param newEmail - The new email address
 * @param currentPassword - Current password for re-authentication
 * @param sendVerification - Whether to send verification email before updating (recommended)
 * @returns Promise<void>
 */
export async function updateUserEmail(
  newEmail: string,
  currentPassword: string,
  sendVerification: boolean = true
): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error("No authenticated user found");
    }

    authServiceLogger.info("Starting email update process", {
      userId: user.uid,
      oldEmail: user.email,
      newEmail: newEmail,
    });

    // Re-authenticate user before email change (Firebase security requirement)
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    authServiceLogger.info("User re-authenticated successfully", { userId: user.uid });

    if (sendVerification) {
      // Send verification email to new address before updating
      await verifyBeforeUpdateEmail(user, newEmail, actionCodeSettings);
      authServiceLogger.info("Verification email sent to new address", {
        userId: user.uid,
        newEmail: newEmail,
      });
    } else {
      // Update email directly without verification (not recommended)
      await updateEmail(user, newEmail);
      authServiceLogger.info("Email updated directly without verification", {
        userId: user.uid,
        newEmail: newEmail,
      });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    authServiceLogger.error("Error updating user email", { error: errorMessage });
    if (error instanceof FirebaseError) {
      // Provide more user-friendly error messages
      switch (error.code) {
        case "auth/wrong-password":
          throw new Error("Incorrect password. Please try again.");
        case "auth/invalid-email":
          throw new Error("Invalid email address format.");
        case "auth/email-already-in-use":
          throw new Error("This email is already in use by another account.");
        case "auth/requires-recent-login":
          throw new Error("Please log out and log back in before changing your email.");
        default:
          throw new Error(error.message || "Failed to update email. Please try again.");
      }
    }
    throw error;
  }
}

/**
 * Syncs Firebase Auth email with Firestore on login
 * This ensures that when a user verifies a new email and logs in,
 * the Firestore database is updated to match
 */
async function syncEmailOnLogin(userId: string, authEmail: string | null): Promise<void> {
  if (!authEmail) return;

  try {
    // Get current user data from Firestore
    const publicUserDocRef = doc(db, "Users", "Active", "Public", userId);
    const privateUserDocRef = doc(db, "Users", "Active", "Private", userId);

    const privateUserDoc = await getDoc(privateUserDocRef);

    if (privateUserDoc.exists()) {
      const privateUserData = privateUserDoc.data();
      const firestoreEmail = privateUserData?.contactInformation?.email;

      // Check if email in Firebase Auth differs from Firestore
      if (firestoreEmail && firestoreEmail !== authEmail) {
        authServiceLogger.info("Email mismatch detected on login, syncing database", {
          userId,
          firestoreEmail,
          authEmail,
        });

        // Update Firestore with the verified email from Firebase Auth
        await updateUser(userId, {
          contactInformation: {
            email: authEmail,
            mobile: privateUserData?.contactInformation?.mobile || "",
          },
        });

        // Clear cache
        bustUserLocalStorageCache();

        authServiceLogger.info("Email successfully synced to database on login", {
          userId,
          newEmail: authEmail,
        });
      }
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    authServiceLogger.error("Error syncing email on login", { error: errorMessage, userId });
    // Don't throw error - this is a non-critical operation
  }
}

// can write to any empty username
// can write to a username which has your userid
