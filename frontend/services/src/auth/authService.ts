import { EmptyUserData, NewUserData, UserData, UserId } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import { FirebaseError } from "@firebase/util";
import {
  AuthProvider,
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  FacebookAuthProvider,
  getAdditionalUserInfo,
  GoogleAuthProvider,
  OAuthProvider,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  UserCredential,
  verifyBeforeUpdateEmail,
} from "firebase/auth";
import { EndpointType } from "@/interfaces/FunctionsTypes";
import { bustEventsLocalStorageCache } from "../events/eventsUtils/getEventsUtils";
import { executeGlobalAppControllerFunction } from "../functions/functionsUtils";
import { auth } from "../firebase";
import { bustOrganiserEventsCache } from "../organiser/organiserEventsCache";
import { getPrivateUserById, getPublicUserById, updateUser } from "../users/usersService";
import { UserNotFoundError } from "../users/userErrors";
import { bustUserLocalStorageCache } from "../users/usersUtils/getUsersUtils";
import { mapSocialAuthError } from "./socialAuthUtils";

const authServiceLogger = new Logger("authServiceLogger");

export async function handleEmailAndPasswordSignUp(data: NewUserData) {
  let userCredential; // Declare userCredential outside the try block to access it in the catch block

  try {
    // Create a new user with email and password
    userCredential = await createUserWithEmailAndPassword(auth, data.contactInformation.email, data.password);
    const displayName = data.firstName.trim() || "User";
    await updateProfile(userCredential.user, { displayName });
    authServiceLogger.info("Firebase Auth Object Created", {
      email: data.contactInformation.email,
      userId: userCredential.user.uid,
    });
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
    bustOrganiserEventsCache();
    setUser(EmptyUserData as UserData);
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
      const userId = userCredential.user.uid as UserId;
      await ensureProvisionedUser();
      await syncEmailOnLogin(userId);
      return userId;
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

// Held open during a social popup so the auth listener does not provision
// before Apple's one-time name is copied onto the Auth user.
let socialNameReady: Promise<void> = Promise.resolve();
let ensureProvisionedInFlight: Promise<void> | null = null;

/** Creates the Firestore profile once, after sign-in, when the public doc is missing. */
export function ensureProvisionedUser(): Promise<void> {
  if (ensureProvisionedInFlight) {
    return ensureProvisionedInFlight;
  }
  ensureProvisionedInFlight = (async () => {
    await socialNameReady;
    const user = auth.currentUser;
    if (!user) {
      throw new Error("No authenticated user");
    }
    try {
      // Live read. A cached profile must not hide a document that was never created.
      await getPublicUserById(user.uid as UserId, true);
      return;
    } catch (error) {
      if (!(error instanceof UserNotFoundError)) {
        throw error;
      }
    }
    await executeGlobalAppControllerFunction(EndpointType.PROVISION_USER, {}, { attachAuth: true });
  })().finally(() => {
    ensureProvisionedInFlight = null;
  });
  return ensureProvisionedInFlight;
}

export function handleGoogleSignIn(): Promise<UserId | null> {
  return signInWithSocialProvider(new GoogleAuthProvider());
}

export function handleAppleSignIn(): Promise<UserId | null> {
  const provider = new OAuthProvider("apple.com");
  provider.addScope("email");
  provider.addScope("name");
  return signInWithSocialProvider(provider);
}

export function handleFacebookSignIn(): Promise<UserId | null> {
  const provider = new FacebookAuthProvider();
  provider.addScope("email");
  provider.addScope("public_profile");
  return signInWithSocialProvider(provider);
}

async function signInWithSocialProvider(provider: AuthProvider): Promise<UserId | null> {
  let releaseSocialName = () => {};
  socialNameReady = new Promise((resolve) => {
    releaseSocialName = resolve;
  });
  try {
    const credential = await signInWithPopup(auth, provider);
    const displayName = resolveSocialDisplayName(credential);
    if (displayName && !credential.user.displayName) {
      await updateProfile(credential.user, { displayName });
    }
    releaseSocialName();
    await ensureProvisionedUser();
    const userId = credential.user.uid as UserId;
    authServiceLogger.info("Social sign-in succeeded", { userId, provider: provider.providerId });
    return userId;
  } catch (error) {
    releaseSocialName();
    const message = mapSocialAuthError(error);
    if (message === null) {
      return null;
    }
    authServiceLogger.error("Social sign-in failed", {
      message,
      provider: provider.providerId,
    });
    throw new Error(message);
  }
}

function resolveSocialDisplayName(credential?: UserCredential): string | null {
  if (!credential) {
    return null;
  }
  if (credential.user.displayName) {
    return credential.user.displayName;
  }
  const profile = getAdditionalUserInfo(credential)?.profile as { name?: unknown } | undefined;
  if (typeof profile?.name === "string") {
    return profile.name;
  }
  if (profile?.name && typeof profile.name === "object") {
    const name = profile.name as { firstName?: string; lastName?: string };
    return [name.firstName, name.lastName].filter(Boolean).join(" ") || null;
  }
  return null;
}

const actionCodeSettings = {
  // URL you want to redirect back to. The domain (www.example.com) for this
  // URL must be in the authorized domains list in the Firebase Console.
  url: "https://www.sportshub.net.au/login",
};

export async function resetUserPassword(email: string): Promise<void> {
  try {
    // Send password reset email
    await sendPasswordResetEmail(auth, email);
    // Password reset email sent successfully
    authServiceLogger.info("Password reset email sent");
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
export async function syncEmailOnLogin(userId: UserId): Promise<void> {
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
