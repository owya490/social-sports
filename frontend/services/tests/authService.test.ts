import { EmptyNewUserData } from "@/interfaces/UserTypes";
import {
  createUserWithEmailAndPassword,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  verifyBeforeUpdateEmail,
} from "firebase/auth";
import { setDoc } from "firebase/firestore";
import {
  handleEmailAndPasswordSignIn,
  handleEmailAndPasswordSignUp,
  resetUserPassword,
  updateUserEmail,
} from "../src/auth/authService";
import { auth } from "../src/firebase";

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
jest.mock("firebase/firestore", () => ({ doc: jest.fn(() => "user-document"), setDoc: jest.fn() }));
jest.mock("../src/firebase", () => ({ auth: { currentUser: null }, db: {} }));
jest.mock("@/observability/logger", () => ({
  Logger: jest.fn(() => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn() })),
}));
jest.mock("../src/users/usersService", () => ({
  createUser: jest.fn(),
  deleteUser: jest.fn(),
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

  it("sends signup verification with the validated destination and keeps staged data password-free", async () => {
    await handleEmailAndPasswordSignUp(
      { ...EmptyNewUserData, password, contactInformation: { email, mobile: "" } },
      destination
    );

    expectContinuation(jest.mocked(sendEmailVerification).mock.calls[0][1]);
    expect(setDoc).toHaveBeenCalledWith("user-document", expect.objectContaining({ userId: user.uid }));
    expect(jest.mocked(setDoc).mock.calls[0][1]).not.toHaveProperty("password");
  });

  it("retains the destination when resending verification for an unverified login", async () => {
    await expect(handleEmailAndPasswordSignIn(email, password, destination)).rejects.toThrow(
      "Email is not verified"
    );

    expectContinuation(jest.mocked(sendEmailVerification).mock.calls[0][1]);
    expect(signOut).toHaveBeenCalledWith(auth);
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
});
