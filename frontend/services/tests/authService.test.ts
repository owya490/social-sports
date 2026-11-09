import { EmptyNewUserData, EmptyPrivateUserData, EmptyPublicUserData, EmptyUserData, UserId } from "@/interfaces/UserTypes";
import {
  createUserWithEmailAndPassword,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  verifyBeforeUpdateEmail,
} from "firebase/auth";
import { runTransaction, setDoc, Transaction } from "firebase/firestore";
import {
  handleEmailAndPasswordSignIn,
  handleEmailAndPasswordSignUp,
  ensureActiveUserFromAuth,
  migrateTempUserToActiveUser,
  resetUserPassword,
  updateUserEmail,
} from "../src/auth/authService";
import { auth } from "../src/firebase";
import { UserNotFoundError } from "../src/users/userErrors";
import { createUser, getFullUserById, getPrivateUserById } from "../src/users/usersService";

jest.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  sendEmailVerification: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  signOut: jest.fn(),
  reauthenticateWithCredential: jest.fn(),
  verifyBeforeUpdateEmail: jest.fn(),
  EmailAuthProvider: { credential: jest.fn(() => "credential") },
}));
jest.mock("firebase/firestore", () => ({
  ...jest.requireActual("firebase/firestore"),
  doc: jest.fn((_db, ...path: string[]) => path.join("/")),
  setDoc: jest.fn(),
  runTransaction: jest.fn(),
}));
jest.mock("../src/firebase", () => ({ auth: { currentUser: null }, db: {} }));
jest.mock("@/observability/logger", () => ({
  Logger: jest.fn(() => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn() })),
}));
jest.mock("../src/users/usersService", () => ({
  ...jest.requireActual("../src/users/usersService"),
  createUser: jest.fn(),
  getFullUserById: jest.fn(),
  getPrivateUserById: jest.fn(),
  getPublicUserById: jest.fn(),
  updateUser: jest.fn(),
}));
jest.mock("../src/events/eventsUtils/getEventsUtils", () => ({ bustEventsLocalStorageCache: jest.fn() }));
jest.mock("../src/users/usersUtils/getUsersUtils", () => ({ bustUserLocalStorageCache: jest.fn() }));
jest.mock("../src/organiser/organiserEventsCache", () => ({ bustOrganiserEventsCache: jest.fn() }));

describe("auth email continuations", () => {
  const email = "organiser@example.com";
  const password = "password";
  const user = { uid: "user-1", email, emailVerified: false };
  const destination = "/organiser/v2/event/event-1?tab=tickets%26details#booking";
  const defaultSettings = { url: "https://www.sportshub.net.au/login" };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(runTransaction).mockReset();
    jest.mocked(createUser).mockReset();
    jest.mocked(getFullUserById).mockReset();
    jest.mocked(createUserWithEmailAndPassword).mockResolvedValue({ user } as Awaited<
      ReturnType<typeof createUserWithEmailAndPassword>
    >);
    jest.mocked(signInWithEmailAndPassword).mockResolvedValue({ user } as Awaited<
      ReturnType<typeof signInWithEmailAndPassword>
    >);
  });

  function expectContinuation(settings: unknown) {
    expect(settings).toEqual({ url: expect.any(String) });
    const url = new URL((settings as { url: string }).url);
    expect(url.origin).toBe("https://www.sportshub.net.au");
    expect(url.pathname).toBe("/login");
    expect(url.searchParams.get("returnTo")).toBe(destination);
  }

  function promotionStore(initial: Record<string, unknown>, failCommit = false) {
    const documents = new Map<string, unknown>(Object.entries(initial));
    const snapshot = (path: string) => ({
      exists: () => documents.has(path),
      data: () => documents.get(path),
    });
    jest.mocked(runTransaction).mockImplementation(async (_db, update) => {
      const writes = new Map<string, unknown | null>();
      const transaction = {
        get: (ref: string) => Promise.resolve(snapshot(ref)),
        set: (ref: string, data: unknown) => { writes.set(ref, data); },
        delete: (ref: string) => { writes.set(ref, null); },
      } as unknown as Transaction;
      const result = await update(transaction);
      if (failCommit) throw new Error("Firestore unavailable");
      for (const [path, data] of writes) {
        if (data === null) documents.delete(path);
        else documents.set(path, data);
      }
      return result;
    });
    return documents;
  }

  it("sends signup verification with the validated destination and keeps staged data password-free", async () => {
    await handleEmailAndPasswordSignUp(
      { ...EmptyNewUserData, password, contactInformation: { email, mobile: "" } },
      destination
    );

    expectContinuation(jest.mocked(sendEmailVerification).mock.calls[0][1]);
    expect(setDoc).toHaveBeenCalledWith("TempUsers/user-1", expect.objectContaining({ userId: user.uid }));
    expect(jest.mocked(setDoc).mock.calls[0][1]).not.toHaveProperty("password");
  });

  it("retains the destination when resending verification for an unverified login", async () => {
    const previousUser = auth.currentUser;
    Object.assign(auth, { currentUser: user });
    try {
      await expect(handleEmailAndPasswordSignIn(email, password, destination)).rejects.toThrow(
        "Email is not verified"
      );

      expectContinuation(jest.mocked(sendEmailVerification).mock.calls[0][1]);
      expect(signOut).toHaveBeenCalledWith(auth);
    } finally {
      Object.assign(auth, { currentUser: previousUser });
    }
  });

  it.each([undefined, "https://example.com/organiser", "/login"])(
    "preserves verification defaults for absent or invalid intent %s",
    async (returnTo) => {
      await handleEmailAndPasswordSignUp(
        { ...EmptyNewUserData, password, contactInformation: { email, mobile: "" } },
        returnTo
      );
      expect(sendEmailVerification).toHaveBeenLastCalledWith(user, defaultSettings);

      await expect(handleEmailAndPasswordSignIn(email, password, returnTo)).rejects.toThrow(
        "Email is not verified"
      );
      expect(sendEmailVerification).toHaveBeenLastCalledWith(user, defaultSettings);
    }
  );

  it("sends password reset continuation only for a validated destination", async () => {
    await resetUserPassword(email, destination);

    expect(sendPasswordResetEmail).toHaveBeenCalledWith(auth, email, expect.any(Object));
    expectContinuation(jest.mocked(sendPasswordResetEmail).mock.calls[0][2]);
  });

  it.each([undefined, "//example.com/organiser", "/resetPassword"])(
    "preserves the two-argument password reset default for absent or invalid intent %s",
    async (returnTo) => {
      await resetUserPassword(email, returnTo);
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(auth, email);
    }
  );

  it("keeps change-email continuation independent from sign-in destinations", async () => {
    const currentUser = auth.currentUser;
    Object.assign(auth, { currentUser: user });
    try {
      await updateUserEmail("new@example.com", password);
      expect(reauthenticateWithCredential).toHaveBeenCalledWith(user, "credential");
      expect(verifyBeforeUpdateEmail).toHaveBeenCalledWith(user, "new@example.com", defaultSettings);
    } finally {
      Object.assign(auth, { currentUser });
    }
  });

  it("atomically promotes a verified staged user", async () => {
    const userId = "staged-user" as UserId;
    const staged = { ...EmptyUserData, userId, firstName: "Alex" };
    const documents = promotionStore({ [`TempUsers/${userId}`]: staged });

    await expect(migrateTempUserToActiveUser(userId)).resolves.toBeUndefined();
    expect(documents.has(`TempUsers/${userId}`)).toBe(false);
    expect(documents.get(`Usernames/alex`)).toEqual({ userId });
    expect(documents.get(`Users/Active/Public/${userId}`)).toMatchObject({ userId, username: "alex", firstName: "Alex" });
    expect(documents.get(`Users/Active/Private/${userId}`)).toMatchObject({ userId, onboardingCompletedAt: null });
    expect(createUser).not.toHaveBeenCalled();
  });

  it("repairs an interrupted Public write without overwriting its username", async () => {
    const userId = "staged-user" as UserId;
    const publicData = { ...EmptyPublicUserData, userId, username: "existing-name", bio: "Updated bio" };
    const documents = promotionStore({
      [`TempUsers/${userId}`]: { ...EmptyUserData, userId, firstName: "Alex" },
      [`Users/Active/Public/${userId}`]: publicData,
    });

    await migrateTempUserToActiveUser(userId);
    expect(documents.get(`Users/Active/Public/${userId}`)).toBe(publicData);
    expect(documents.has(`Users/Active/Private/${userId}`)).toBe(true);
    expect(documents.has(`TempUsers/${userId}`)).toBe(false);
  });

  it("repairs an interrupted Private write and preserves its data", async () => {
    const userId = "staged-user" as UserId;
    const privateData = { ...EmptyPrivateUserData, userId, location: "Sydney" };
    const documents = promotionStore({
      [`TempUsers/${userId}`]: { ...EmptyUserData, userId, firstName: "Alex" },
      [`Users/Active/Private/${userId}`]: privateData,
    });

    await migrateTempUserToActiveUser(userId);
    expect(documents.get(`Users/Active/Private/${userId}`)).toBe(privateData);
    expect(documents.has(`Users/Active/Public/${userId}`)).toBe(true);
    expect(documents.has(`TempUsers/${userId}`)).toBe(false);
  });

  it("clears a stranded staged record without recreating a complete active profile", async () => {
    const userId = "staged-user" as UserId;
    const publicData = { ...EmptyPublicUserData, userId, username: "existing-name", bio: "Updated bio" };
    const privateData = { ...EmptyPrivateUserData, userId, location: "Sydney" };
    const documents = promotionStore({
      [`TempUsers/${userId}`]: { ...EmptyUserData, userId, firstName: "Alex" },
      [`Users/Active/Public/${userId}`]: publicData,
      [`Users/Active/Private/${userId}`]: privateData,
    });

    await migrateTempUserToActiveUser(userId);
    expect(documents.get(`Users/Active/Public/${userId}`)).toBe(publicData);
    expect(documents.get(`Users/Active/Private/${userId}`)).toBe(privateData);
    expect(documents.has(`TempUsers/${userId}`)).toBe(false);
    expect(createUser).not.toHaveBeenCalled();
  });

  it("keeps an existing account idempotent and rejects missing staged data for an incomplete account", async () => {
    const userId = "staged-user" as UserId;
    const documents = promotionStore({
      [`Users/Active/Public/${userId}`]: { ...EmptyPublicUserData, userId, username: "alex" },
      [`Users/Active/Private/${userId}`]: { ...EmptyPrivateUserData, userId },
    });
    await expect(migrateTempUserToActiveUser(userId)).resolves.toBeUndefined();
    documents.delete(`Users/Active/Private/${userId}`);
    await expect(migrateTempUserToActiveUser(userId)).rejects.toThrow("User data not found.");
    expect(documents.has(`Users/Active/Public/${userId}`)).toBe(true);
  });

  it("chooses an available username without replacing another user's mapping", async () => {
    const userId = "staged-user" as UserId;
    const documents = promotionStore({
      [`TempUsers/${userId}`]: { ...EmptyUserData, userId, firstName: "Alex" },
      "Usernames/alex": { userId: "other-user" },
    });

    await migrateTempUserToActiveUser(userId);
    expect(documents.get("Usernames/alex")).toEqual({ userId: "other-user" });
    expect(documents.get("Usernames/alex1")).toEqual({ userId });
  });

  it("recovers a verified email sign-in with a stranded Public profile", async () => {
    const userId = "staged-user" as UserId;
    const documents = promotionStore({
      [`TempUsers/${userId}`]: { ...EmptyUserData, userId, firstName: "Alex" },
      [`Users/Active/Public/${userId}`]: { ...EmptyPublicUserData, userId, username: "alex" },
    });
    jest.mocked(signInWithEmailAndPassword).mockResolvedValue({ user: { ...user, uid: userId, emailVerified: true } } as Awaited<
      ReturnType<typeof signInWithEmailAndPassword>
    >);

    await expect(handleEmailAndPasswordSignIn(email, password)).resolves.toBe(userId);
    expect(documents.has(`Users/Active/Private/${userId}`)).toBe(true);
    expect(documents.has(`TempUsers/${userId}`)).toBe(false);
    expect(signOut).not.toHaveBeenCalled();
  });

  it("does not sign out a newer account when an earlier email promotion fails", async () => {
    const firstUser = { ...user, uid: "email-a", emailVerified: true };
    jest.mocked(signInWithEmailAndPassword).mockResolvedValue({ user: firstUser } as Awaited<
      ReturnType<typeof signInWithEmailAndPassword>
    >);
    let failPromotion!: (reason: Error) => void;
    jest.mocked(runTransaction).mockReturnValue(new Promise((_, reject) => { failPromotion = reject; }));
    const previousUser = auth.currentUser;
    Object.assign(auth, { currentUser: firstUser });
    try {
      const signIn = handleEmailAndPasswordSignIn(email, password);
      await Promise.resolve();
      Object.assign(auth, { currentUser: { uid: "email-b", email: "other@example.com" } });
      failPromotion(new Error("Firestore unavailable"));

      await expect(signIn).rejects.toThrow("Firestore unavailable");
      expect(signOut).not.toHaveBeenCalled();
    } finally {
      Object.assign(auth, { currentUser: previousUser });
    }
  });

  it("leaves staged data available for retry when the transaction fails", async () => {
    const userId = "staged-user" as UserId;
    const documents = promotionStore({ [`TempUsers/${userId}`]: { ...EmptyUserData, userId, firstName: "Alex" } }, true);

    await expect(migrateTempUserToActiveUser(userId)).rejects.toThrow("Firestore unavailable");
    expect(documents.has(`TempUsers/${userId}`)).toBe(true);
    expect(documents.has(`Users/Active/Public/${userId}`)).toBe(false);
  });

  it("repairs a social account with a Public profile but no Private profile", async () => {
    const userId = "social-user" as UserId;
    jest.mocked(getFullUserById).mockRejectedValue(new UserNotFoundError(userId));
    const credential = { user: { uid: userId, email, displayName: "Alex", photoURL: null } } as NonNullable<
      Parameters<typeof ensureActiveUserFromAuth>[0]
    >;

    await expect(ensureActiveUserFromAuth(credential)).resolves.toBe(userId);
    expect(createUser).toHaveBeenCalledWith(expect.objectContaining({ firstName: "Alex" }), userId);
  });

  it("keeps overlapping social provisioning tied to each auth user", async () => {
    let finishFirstRead!: () => void;
    const firstRead = new Promise<void>((resolve) => { finishFirstRead = resolve; });
    jest.mocked(getFullUserById).mockImplementation(async (userId) => {
      if (userId === "social-a") await firstRead;
      return { ...EmptyUserData, userId };
    });
    const credential = (userId: UserId) => ({ user: { uid: userId, email } } as NonNullable<
      Parameters<typeof ensureActiveUserFromAuth>[0]
    >);

    const first = ensureActiveUserFromAuth(credential("social-a" as UserId));
    await expect(ensureActiveUserFromAuth(credential("social-b" as UserId))).resolves.toBe("social-b");
    finishFirstRead();
    await expect(first).resolves.toBe("social-a");
    expect(createUser).not.toHaveBeenCalled();
  });

  it("does not sync a previous account's email after the active account changes", async () => {
    const userId = "social-a" as UserId;
    let finishProfile!: (value: typeof EmptyUserData) => void;
    jest.mocked(getFullUserById).mockImplementation(() => new Promise((resolve) => { finishProfile = resolve; }));
    const credential = { user: { uid: userId, email } } as NonNullable<
      Parameters<typeof ensureActiveUserFromAuth>[0]
    >;
    const previousUser = auth.currentUser;
    Object.assign(auth, { currentUser: credential.user });
    try {
      const signIn = ensureActiveUserFromAuth(credential);
      Object.assign(auth, { currentUser: { uid: "social-b", email: "other@example.com" } });
      finishProfile({ ...EmptyUserData, userId });

      await expect(signIn).resolves.toBe(userId);
      expect(getPrivateUserById).not.toHaveBeenCalled();
    } finally {
      Object.assign(auth, { currentUser: previousUser });
    }
  });

});
