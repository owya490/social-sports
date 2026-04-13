import { EmptyUserData, NewUserData, UserData, UserId } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import { FirebaseError } from "@firebase/util";
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  FacebookAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  reauthenticateWithCredential,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User,
  UserCredential,
  verifyBeforeUpdateEmail,
} from "firebase/auth";
import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { bustEventsLocalStorageCache } from "../events/eventsUtils/getEventsUtils";
import { FIREBASE_FUNCTIONS_VERIFY_EMAIL_FOR_SSO_USER, getFirebaseFunctionByName } from "../firebaseFunctionsService";
import { auth, db } from "../firebase";
import { UserNotFoundError } from "../users/userErrors";
import { createUser, deleteUser, getPrivateUserById, getPublicUserById, updateUser } from "../users/usersService";
import { bustUserLocalStorageCache } from "../users/usersUtils/getUsersUtils";

const authServiceLogger = new Logger("authServiceLogger");

type VerifySsoEmailResponse = {
  success?: boolean;
  error?: string;
};

async function verifySsoUserEmailWithBackend(firebaseUser: User): Promise<void> {
  // Google (and most IdPs) already set emailVerified; skip callable to avoid CORS / deploy issues in dev.
  if (firebaseUser.emailVerified) {
    return;
  }

  const callable = getFirebaseFunctionByName(FIREBASE_FUNCTIONS_VERIFY_EMAIL_FOR_SSO_USER);
  const result = await callable({});
  const data = result.data as VerifySsoEmailResponse;
  if (!data?.success) {
    const code = data?.error ?? "unknown";
    authServiceLogger.error("verify_email_for_sso_user failed", { code });
    if (code === "not_sso") {
      throw new Error("This sign-in method is not eligible for automatic email verification.");
    }
    if (code === "unauthenticated") {
      throw new Error("Authentication failed. Please try again.");
    }
    if (code === "user_not_found") {
      throw new Error("Account not found. Please try again.");
    }
    throw new Error("Could not verify your account. Please try again.");
  }
  await reload(firebaseUser);
}

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

        // Sync email from Firebase Auth to Firestore if needed
        await syncEmailOnLogin(userCredential.user.uid);

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

/**
 * Email/password login: send the user to /register when there is no Firebase account or no app profile.
 * Note: some Firebase versions use `auth/invalid-credential` for both wrong password and missing user,
 * so we cannot redirect in that case without risking false positives.
 */
export function shouldRedirectToRegisterAfterFailedLogin(error: unknown): boolean {
  if (error instanceof FirebaseError && error.code === "auth/user-not-found") {
    return true;
  }
  if (error instanceof Error && error.message === "User data not found.") {
    return true;
  }
  return false;
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

function buildUserDataFromFirebaseUser(firebaseUser: User): UserData {
  const email = firebaseUser.email?.trim();
  if (!email) {
    throw new Error(
      "We could not read an email from this sign-in. Try another method or check your Apple/Google account settings.",
    );
  }

  let firstName = "";
  let surname = "";
  const displayName = firebaseUser.displayName?.trim();
  if (displayName) {
    const parts = displayName.split(/\s+/).filter(Boolean);
    firstName = parts[0] ?? "";
    surname = parts.slice(1).join(" ");
  }
  if (!firstName) {
    const localPart = email.split("@")[0]?.replace(/[^a-zA-Z0-9]/g, "") ?? "";
    firstName = localPart.length >= 1 ? localPart : "User";
  }

  const profilePicture = firebaseUser.photoURL ?? EmptyUserData.profilePicture;

  return {
    ...EmptyUserData,
    userId: firebaseUser.uid,
    firstName,
    surname,
    profilePicture,
    publicContactInformation: {
      ...EmptyUserData.publicContactInformation,
      email,
      mobile: "",
    },
    contactInformation: {
      ...EmptyUserData.contactInformation,
      email,
      mobile: "",
    },
  };
}

/**
 * Resolves or creates the app user profile after OAuth sign-in (Google, Apple, Facebook).
 * New OAuth users get a Firestore profile from the provider; email/password sign-in keeps its own flow.
 */
async function completeSignInAfterAuthenticatedUser(uid: string): Promise<UserId | null> {
  try {
    await getPublicUserById(uid);
    await syncEmailOnLogin(uid);
    return uid;
  } catch (error: unknown) {
    if (error instanceof UserNotFoundError) {
      authServiceLogger.info("User not found in public users. Attempting to retrieve temporary user data.", {
        userId: uid,
      });

      const userData = await getTempUserData(uid);

      if (userData !== null) {
        try {
          await createUser(userData, uid);
          authServiceLogger.info("Temporary user data found and user created successfully.", { userId: uid });
          await deleteTempUserData(uid);
          authServiceLogger.info("Temporary user data deleted after successful creation.", { userId: uid });
          return uid;
        } catch {
          authServiceLogger.error("Error during user creation. Attempting rollback.", { userId: uid });
          try {
            await deleteUser(uid);
            authServiceLogger.error("User creation rolled back successfully.", { userId: uid });
          } catch (rollbackError) {
            const rollbackErrorMessage =
              rollbackError instanceof Error ? rollbackError.message : "Unknown error during rollback";
            authServiceLogger.error("Failed to roll back user creation:", {
              error: rollbackErrorMessage,
              userId: uid,
            });
          }
          throw new Error("User creation failed, rolled back the changes.");
        }
      } else {
        const firebaseUser = auth.currentUser;
        if (!firebaseUser || firebaseUser.uid !== uid) {
          authServiceLogger.error("No Firebase session for OAuth profile creation.", { userId: uid });
          throw new Error("Sign in session expired. Please try again.");
        }

        authServiceLogger.info("No existing profile; creating user from OAuth provider.", { userId: uid });
        let oauthUserData: UserData;
        try {
          oauthUserData = buildUserDataFromFirebaseUser(firebaseUser);
        } catch (e: unknown) {
          throw e instanceof Error ? e : new Error("Could not create a profile from this account.");
        }

        try {
          await createUser(oauthUserData, uid);
          authServiceLogger.info("OAuth profile created successfully.", { userId: uid });
          await syncEmailOnLogin(uid);
          return uid;
        } catch {
          authServiceLogger.error("Error during OAuth user creation. Attempting rollback.", { userId: uid });
          try {
            await deleteUser(uid);
            authServiceLogger.error("OAuth user creation rolled back.", { userId: uid });
          } catch (rollbackError) {
            const rollbackErrorMessage =
              rollbackError instanceof Error ? rollbackError.message : "Unknown error during rollback";
            authServiceLogger.error("Failed to roll back OAuth user creation.", {
              error: rollbackErrorMessage,
              userId: uid,
            });
          }
          throw new Error("User creation failed, rolled back the changes.");
        }
      }
    } else {
      throw error;
    }
  }
}

function mapOAuthSignInError(error: unknown): Error {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/popup-closed-by-user":
      case "auth/cancelled-popup-request":
        return new Error("Sign in was cancelled.");
      case "auth/account-exists-with-different-credential":
        return new Error("An account already exists with this email using a different sign-in method.");
      case "auth/operation-not-allowed":
        return new Error("This sign-in method is not enabled.");
      default:
        authServiceLogger.error("OAuth sign-in Firebase error", { code: error.code, message: error.message });
        return new Error(error.message || "Sign in failed.");
    }
  }
  if (error instanceof Error) {
    return error;
  }
  return new Error("An unknown error occurred.");
}

async function signInWithOAuthProviderAndComplete(
  getCredential: () => Promise<UserCredential>,
  label: string,
): Promise<UserId | null> {
  let userCredential: UserCredential | undefined;
  try {
    userCredential = await getCredential();
    await verifySsoUserEmailWithBackend(userCredential.user);
    authServiceLogger.info(`${label} sign-in completed`, { userId: userCredential.user.uid });
    return await completeSignInAfterAuthenticatedUser(userCredential.user.uid);
  } catch (error: unknown) {
    if (userCredential) {
      try {
        await signOut(auth);
        authServiceLogger.info(`User signed out after error during ${label} sign-in`, {
          userId: userCredential.user.uid,
        });
      } catch (signOutError) {
        authServiceLogger.error("Failed to sign out user during OAuth error handling.", {
          error: signOutError instanceof Error ? signOutError.message : "Unknown error",
          label,
        });
      }
    }
    throw mapOAuthSignInError(error);
  }
}

export async function handleGoogleSignIn(): Promise<UserId | null> {
  return signInWithOAuthProviderAndComplete(async () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }, "Google");
}

export async function handleAppleSignIn(): Promise<UserId | null> {
  return signInWithOAuthProviderAndComplete(async () => {
    const provider = new OAuthProvider("apple.com");
    provider.addScope("email");
    provider.addScope("name");
    return signInWithPopup(auth, provider);
  }, "Apple");
}

export async function handleFacebookSignIn(): Promise<UserId | null> {
  return signInWithOAuthProviderAndComplete(async () => {
    const provider = new FacebookAuthProvider();
    return signInWithPopup(auth, provider);
  }, "Facebook");
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
 * Updates user's email address after re-authentication
 * Sends verification email to new address before updating
 * @param newEmail - The new email address to update to
 * @param currentPassword - Current password for re-authentication
 * @throws Error with user-friendly message for various failure cases
 */
export async function updateUserEmail(newEmail: string, currentPassword: string): Promise<void> {
  try {
    const user = auth.currentUser;

    if (!user || !user.email) {
      throw new Error("No user is currently signed in");
    }

    // Check if new email is different from current
    if (user.email === newEmail) {
      throw new Error("New email must be different from your current email");
    }

    // Re-authenticate user with current password for security
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    authServiceLogger.info("User re-authenticated successfully for email change", { userId: user.uid });

    // Send verification email to new address
    await verifyBeforeUpdateEmail(user, newEmail, actionCodeSettings);

    authServiceLogger.info("Verification email sent for email change", {
      userId: user.uid,
      oldEmail: user.email,
      newEmail: newEmail,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    authServiceLogger.error("Error updating user email", { error: errorMessage });

    // Provide user-friendly error messages
    if (error instanceof FirebaseError) {
      switch (error.code) {
        case "auth/invalid-credential":
        case "auth/wrong-password":
          throw new Error("Incorrect password. Please try again.");
        case "auth/invalid-email":
          throw new Error("Please enter a valid email address.");
        case "auth/email-already-in-use":
          throw new Error("This email is already in use by another account.");
        case "auth/requires-recent-login":
          throw new Error("For security reasons, please log out and log back in before changing your email.");
        case "auth/too-many-requests":
          throw new Error("Too many attempts. Please try again later.");
        default:
          throw new Error(error.message || "Failed to update email. Please try again.");
      }
    }

    throw error;
  }
}

/**
 * Syncs Firebase Auth email with Firestore during login
 * Called automatically after successful login to ensure consistency
 * @param userId - The user ID to sync email for
 */
export async function syncEmailOnLogin(userId: string): Promise<void> {
  try {
    const user = auth.currentUser;

    if (!user || !user.email) {
      authServiceLogger.warn("Cannot sync email - no authenticated user", { userId });
      return;
    }

    // Get current user data using service layer
    const privateUserData = await getPrivateUserById(userId);
    const currentFirestoreEmail = privateUserData?.contactInformation?.email;

    // Sync if emails don't match
    if (currentFirestoreEmail !== user.email) {
      authServiceLogger.info("Email mismatch detected, syncing...", {
        userId,
        authEmail: user.email,
        firestoreEmail: currentFirestoreEmail,
      });

      // Update email using service layer
      await updateUser(userId, {
        contactInformation: {
          ...privateUserData.contactInformation,
          email: user.email,
        },
      });

      // Clear local storage cache to force refresh
      bustUserLocalStorageCache();

      authServiceLogger.info("Email synced successfully", { userId, newEmail: user.email });
    }
  } catch (error) {
    // Non-critical operation - log but don't throw
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    authServiceLogger.error("Error syncing email on login", { userId, error: errorMessage });
  }
}

// can write to any empty username
// can write to a username which has your userid
