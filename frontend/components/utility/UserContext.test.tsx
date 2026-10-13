/** @jest-environment jsdom */
import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { User } from "firebase/auth";
import { EmptyUserData, UserData, UserId } from "@/interfaces/UserTypes";
import { getFullUserByIdForUserContextWithRetries } from "@/services/src/users/usersService";
import OnboardingPersonaPage from "@/app/(no-footer)/onboarding/page";
import UserContext, { useUser } from "./UserContext";

const mockRouter = { replace: jest.fn(), push: jest.fn() };
const mockAuth: { currentUser: User | null } = { currentUser: null };
let mockAuthListener: (user: User | null) => Promise<void>;

jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => window.location.pathname,
  useSearchParams: () => new URLSearchParams(window.location.search),
}));
jest.mock("@/services/src/firebase", () => ({ auth: { get currentUser() { return mockAuth.currentUser; } } }));
jest.mock("firebase/auth", () => ({
  onAuthStateChanged: jest.fn((_auth, listener) => {
    mockAuthListener = listener;
    return jest.fn();
  }),
}));
jest.mock("@/services/src/users/usersService", () => ({
  getFullUserByIdForUserContextWithRetries: jest.fn(),
  updateUser: jest.fn(),
}));
jest.mock("@/services/src/auth/authService", () => ({
  ensureActiveUserFromAuth: jest.fn(),
  migrateTempUserToActiveUser: jest.fn(),
}));
jest.mock("@/services/src/auth/socialAuthUtils", () => ({ isSocialAuthUser: jest.fn(() => false) }));

function CurrentUser() {
  const { user, userLoading } = useUser();
  return <output>{userLoading ? "loading" : user.userId || "signed out"}</output>;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => { resolve = complete; });
  return { promise, resolve };
}

function firebaseUser(userId: string) {
  return { uid: userId, emailVerified: true } as User;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.currentUser = null;
  window.history.replaceState({}, "", "/organiser/v2/event/one?tab=tickets&filter=paid#ticket-types");
});

describe("UserContext route and account ownership", () => {
  it("waits for Firebase auth before redirecting with the complete protected destination", async () => {
    render(<UserContext><CurrentUser /></UserContext>);
    expect(screen.getByText("loading")).toBeTruthy();
    expect(mockRouter.replace).not.toHaveBeenCalled();
    await act(async () => { await mockAuthListener(null); });
    expect(mockRouter.replace).toHaveBeenCalledWith(
      "/login?returnTo=%2Forganiser%2Fv2%2Fevent%2Fone%3Ftab%3Dtickets%26filter%3Dpaid%23ticket-types",
    );
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it("is the sole signed-out redirect owner when an onboarding child mounts", async () => {
    window.history.replaceState({}, "", "/onboarding?source=event#create");
    render(<UserContext><OnboardingPersonaPage /></UserContext>);
    await act(async () => { await mockAuthListener(null); });
    expect(mockRouter.replace.mock.calls).toEqual([["/login?returnTo=%2Fonboarding%3Fsource%3Devent%23create"]]);
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it("discards an earlier account's profile result without clearing the newer account's loading state", async () => {
    const earlier = deferred<UserData>();
    const current = deferred<UserData>();
    const earlierId = "earlier-account" as UserId;
    const currentId = "current-account" as UserId;
    jest.mocked(getFullUserByIdForUserContextWithRetries)
      .mockReturnValueOnce(earlier.promise)
      .mockReturnValueOnce(current.promise);
    render(<UserContext><CurrentUser /></UserContext>);
    let earlierLoad!: Promise<void>;
    let currentLoad!: Promise<void>;
    act(() => {
      mockAuth.currentUser = firebaseUser(earlierId);
      earlierLoad = mockAuthListener(mockAuth.currentUser);
      mockAuth.currentUser = firebaseUser(currentId);
      currentLoad = mockAuthListener(mockAuth.currentUser);
    });
    await act(async () => { earlier.resolve({ ...EmptyUserData, userId: earlierId }); await earlierLoad; });
    expect(screen.getByText("loading")).toBeTruthy();
    expect(mockRouter.replace).not.toHaveBeenCalled();
    await act(async () => { current.resolve({ ...EmptyUserData, userId: currentId }); await currentLoad; });
    expect(screen.getByText(currentId)).toBeTruthy();
    expect(screen.queryByText(earlierId)).toBeNull();
  });

  it("does not restore an account's profile when it resolves after sign-out", async () => {
    const profile = deferred<UserData>();
    const userId = "signed-out-account" as UserId;
    jest.mocked(getFullUserByIdForUserContextWithRetries).mockReturnValue(profile.promise);
    render(<UserContext><CurrentUser /></UserContext>);
    let loading!: Promise<void>;
    act(() => {
      mockAuth.currentUser = firebaseUser(userId);
      loading = mockAuthListener(mockAuth.currentUser);
    });
    await act(async () => {
      mockAuth.currentUser = null;
      await mockAuthListener(null);
    });
    await act(async () => { profile.resolve({ ...EmptyUserData, userId }); await loading; });
    await waitFor(() => expect(screen.getByText("signed out")).toBeTruthy());
    expect(screen.queryByText(userId)).toBeNull();
    expect(mockRouter.push).not.toHaveBeenCalledWith("/error");
    expect(mockRouter.replace).not.toHaveBeenCalledWith("/error");
  });
});
