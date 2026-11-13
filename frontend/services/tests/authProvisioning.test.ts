import { EndpointType } from "@/interfaces/FunctionsTypes";
import { getAdditionalUserInfo, signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile } from "firebase/auth";

import {
  ensureProvisionedUser,
  handleAppleSignIn,
  handleEmailAndPasswordSignIn,
  handleGoogleSignIn,
} from "../src/auth/authService";
import { executeGlobalAppControllerFunction } from "../src/functions/functionsUtils";
import { UserNotFoundError } from "../src/users/userErrors";
import { getPublicUserById } from "../src/users/usersService";

const mockAuthState: {
  currentUser: { uid: string; email?: string; emailVerified?: boolean; displayName?: string | null } | null;
} = { currentUser: null };

jest.mock("../src/firebase", () => ({
  get auth() {
    return mockAuthState;
  },
  db: { name: "db" },
}));

jest.mock("../src/functions/functionsUtils", () => ({
  executeGlobalAppControllerFunction: jest.fn(),
}));

jest.mock("../src/users/usersService", () => ({
  getPrivateUserById: jest.fn(),
  getPublicUserById: jest.fn(),
  updateUser: jest.fn(),
}));

jest.mock("../src/events/eventsUtils/getEventsUtils", () => ({
  bustEventsLocalStorageCache: jest.fn(),
}));

jest.mock("../src/organiser/organiserEventsCache", () => ({
  bustOrganiserEventsCache: jest.fn(),
}));

jest.mock("../src/users/usersUtils/getUsersUtils", () => ({
  bustUserLocalStorageCache: jest.fn(),
}));

jest.mock("@/observability/logger", () => ({
  Logger: class {
    info() {}
    warn() {}
    error() {}
    debug() {}
  },
}));

jest.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: jest.fn(),
  EmailAuthProvider: { credential: jest.fn() },
  FacebookAuthProvider: jest.fn().mockImplementation(() => ({ providerId: "facebook.com", addScope: jest.fn() })),
  getAdditionalUserInfo: jest.fn(),
  GoogleAuthProvider: jest.fn().mockImplementation(() => ({ providerId: "google.com" })),
  OAuthProvider: jest.fn().mockImplementation((providerId: string) => ({
    providerId,
    addScope: jest.fn().mockReturnThis(),
  })),
  reauthenticateWithCredential: jest.fn(),
  sendEmailVerification: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
  updateProfile: jest.fn(),
  verifyBeforeUpdateEmail: jest.fn(),
}));

const executeGac = executeGlobalAppControllerFunction as jest.MockedFunction<typeof executeGlobalAppControllerFunction>;
const getPublicUser = getPublicUserById as jest.MockedFunction<typeof getPublicUserById>;
const popupSignIn = signInWithPopup as jest.MockedFunction<typeof signInWithPopup>;
const emailSignIn = signInWithEmailAndPassword as jest.MockedFunction<typeof signInWithEmailAndPassword>;
const updateAuthProfile = updateProfile as jest.MockedFunction<typeof updateProfile>;
const additionalUserInfo = getAdditionalUserInfo as jest.MockedFunction<typeof getAdditionalUserInfo>;
const firebaseSignOut = signOut as jest.MockedFunction<typeof signOut>;

function flush(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

describe("ensureProvisionedUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState.currentUser = null;
    executeGac.mockResolvedValue({ userId: "user-1" });
  });

  it("does nothing when the public profile already exists", async () => {
    mockAuthState.currentUser = { uid: "user-1", emailVerified: true };
    getPublicUser.mockResolvedValue({} as never);

    await ensureProvisionedUser();

    expect(getPublicUser).toHaveBeenCalledWith("user-1", true);
    expect(executeGac).not.toHaveBeenCalled();
  });

  it("asks the backend to provision a verified user who has no profile", async () => {
    mockAuthState.currentUser = { uid: "user-1", emailVerified: true };
    getPublicUser.mockRejectedValue(new UserNotFoundError("user-1"));

    await ensureProvisionedUser();

    expect(executeGac).toHaveBeenCalledWith(EndpointType.PROVISION_USER, {}, { attachAuth: true });
  });

  it("does not provision when the public profile lookup fails", async () => {
    mockAuthState.currentUser = { uid: "user-1", emailVerified: true };
    getPublicUser.mockRejectedValue(new Error("network down"));

    await expect(ensureProvisionedUser()).rejects.toThrow("network down");
    expect(executeGac).not.toHaveBeenCalled();
  });

  it("shares one in-flight provision and allows a later retry", async () => {
    mockAuthState.currentUser = { uid: "user-1", emailVerified: true };
    let settleLookup: (missing: boolean) => void = () => {};
    getPublicUser.mockImplementation(
      () =>
        new Promise((resolve, reject) => {
          settleLookup = (missing) => {
            if (missing) {
              reject(new UserNotFoundError("user-1"));
            } else {
              resolve({} as never);
            }
          };
        })
    );

    const first = ensureProvisionedUser();
    const second = ensureProvisionedUser();
    await flush();
    expect(getPublicUser).toHaveBeenCalledTimes(1);
    settleLookup(true);
    await Promise.all([first, second]);
    expect(executeGac).toHaveBeenCalledTimes(1);

    executeGac.mockRejectedValueOnce(new Error("provision failed"));
    getPublicUser.mockRejectedValueOnce(new UserNotFoundError("user-1"));
    await expect(ensureProvisionedUser()).rejects.toThrow("provision failed");
    expect(executeGac).toHaveBeenCalledTimes(2);

    getPublicUser.mockResolvedValue({} as never);
    await ensureProvisionedUser();
    expect(executeGac).toHaveBeenCalledTimes(2);
    expect(getPublicUser).toHaveBeenCalledTimes(3);
  });

  it("rejects when nobody is signed in", async () => {
    await expect(ensureProvisionedUser()).rejects.toThrow("No authenticated user");
    expect(getPublicUser).not.toHaveBeenCalled();
  });

  it("waits for the social display name before reading the profile", async () => {
    let releasePopup: (credential: unknown) => void = () => {};
    const credential = { user: { uid: "user-1", displayName: "Alex", emailVerified: true } };
    popupSignIn.mockImplementation(
      () =>
        new Promise((resolve) => {
          releasePopup = resolve;
        })
    );
    getPublicUser.mockRejectedValue(new UserNotFoundError("user-1"));
    const signingIn = handleGoogleSignIn();
    try {
      await flush();
      mockAuthState.currentUser = { uid: "user-1", displayName: "Alex", emailVerified: true };

      const provisioning = ensureProvisionedUser();
      await flush();
      expect(getPublicUser).not.toHaveBeenCalled();

      releasePopup(credential);
      await expect(signingIn).resolves.toBe("user-1");
      await provisioning;
      expect(executeGac).toHaveBeenCalledTimes(1);
    } finally {
      releasePopup(credential);
    }
  });
});

describe("sign-in provisioning", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState.currentUser = null;
    executeGac.mockResolvedValue({ userId: "user-1" });
    getPublicUser.mockResolvedValue({} as never);
  });

  it("provisions after a verified email sign-in", async () => {
    const { getPrivateUserById } = jest.requireMock("../src/users/usersService") as {
      getPrivateUserById: jest.Mock;
    };
    getPrivateUserById.mockResolvedValue({ contactInformation: { email: "ada@example.com", mobile: "" } });
    emailSignIn.mockImplementation(() => {
      mockAuthState.currentUser = {
        uid: "user-1",
        email: "ada@example.com",
        emailVerified: true,
        displayName: "Ada",
      };
      return { user: mockAuthState.currentUser } as never;
    });
    getPublicUser.mockRejectedValue(new UserNotFoundError("user-1"));

    await expect(handleEmailAndPasswordSignIn("ada@example.com", "secret")).resolves.toBe("user-1");
    expect(executeGac).toHaveBeenCalledWith(EndpointType.PROVISION_USER, {}, { attachAuth: true });
  });

  it("does not provision an unverified email sign-in", async () => {
    const { sendEmailVerification } = jest.requireMock("firebase/auth") as { sendEmailVerification: jest.Mock };
    sendEmailVerification.mockResolvedValue(undefined);
    firebaseSignOut.mockResolvedValue(undefined);
    emailSignIn.mockResolvedValue({
      user: { uid: "user-1", email: "ada@example.com", emailVerified: false },
    } as never);

    await expect(handleEmailAndPasswordSignIn("ada@example.com", "secret")).rejects.toThrow(
      "Email is not verified"
    );
    expect(executeGac).not.toHaveBeenCalled();
    expect(firebaseSignOut).toHaveBeenCalled();
  });

  it("copies an Apple name onto the auth user before provisioning", async () => {
    const order: string[] = [];
    updateAuthProfile.mockImplementation(() => {
      order.push("profile");
    });
    getPublicUser.mockImplementation(() => {
      order.push("lookup");
      return Promise.resolve({} as never);
    });
    additionalUserInfo.mockReturnValue({
      profile: { name: { firstName: "Ada", lastName: "Lovelace" } },
    } as never);
    const appleUser = { uid: "user-1", displayName: null, emailVerified: true };
    popupSignIn.mockResolvedValue({ user: appleUser } as never);
    mockAuthState.currentUser = appleUser;

    await expect(handleAppleSignIn()).resolves.toBe("user-1");

    expect(updateAuthProfile).toHaveBeenCalledWith(appleUser, { displayName: "Ada Lovelace" });
    expect(order).toEqual(["profile", "lookup"]);
    expect(executeGac).not.toHaveBeenCalled();
  });
});
