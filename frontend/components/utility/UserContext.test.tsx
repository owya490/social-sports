/** @jest-environment jsdom */
import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { User } from "firebase/auth";
import { EmptyUserData, UserId } from "@/interfaces/UserTypes";
import { ensureActiveUserFromAuth, migrateTempUserToActiveUser } from "@/services/src/auth/authService";
import { UserNotFoundError } from "@/services/src/users/userErrors";
import { getFullUserByIdForUserContextWithRetries } from "@/services/src/users/usersService";
import { isSocialAuthUser } from "@/services/src/auth/socialAuthUtils";
import OnboardingPersonaPage from "@/app/(no-footer)/onboarding/page";
import { useAuthPageNavigation } from "@/components/auth/useAuthPageNavigation";
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

function AuthPageNavigation() {
  useAuthPageNavigation();
  return <CurrentUser />;
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
  jest.mocked(migrateTempUserToActiveUser).mockReset();
  jest.mocked(migrateTempUserToActiveUser).mockResolvedValue(undefined);
  jest.mocked(getFullUserByIdForUserContextWithRetries).mockReset();
  jest.mocked(isSocialAuthUser).mockReturnValue(false);
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

  it("keeps an unverified staged user on login", async () => {
    window.history.replaceState({}, "", "/login?returnTo=%2Forganiser%2Fv2");
    render(<UserContext><AuthPageNavigation /></UserContext>);
    await act(async () => {
      mockAuth.currentUser = { uid: "staged-user", emailVerified: false } as User;
      await mockAuthListener(mockAuth.currentUser);
    });
    expect(screen.getByText("signed out")).toBeTruthy();
    expect(migrateTempUserToActiveUser).not.toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("waits for verified staged data to become an active profile before returning", async () => {
    const userId = "staged-user" as UserId;
    const profile = { ...EmptyUserData, userId };
    const promotion = deferred<void>();
    jest.mocked(migrateTempUserToActiveUser).mockReturnValue(promotion.promise);
    jest.mocked(getFullUserByIdForUserContextWithRetries).mockResolvedValue(profile);
    window.history.replaceState({}, "", "/login?returnTo=%2Forganiser%2Fv2");
    render(<UserContext><AuthPageNavigation /></UserContext>);
    let loading!: Promise<void>;
    act(() => {
      mockAuth.currentUser = firebaseUser(userId);
      loading = mockAuthListener(mockAuth.currentUser);
    });
    await waitFor(() => expect(migrateTempUserToActiveUser).toHaveBeenCalledWith(userId));
    expect(screen.getByText("loading")).toBeTruthy();
    expect(mockRouter.replace).not.toHaveBeenCalled();
    await act(async () => { promotion.resolve(); await loading; });
    expect(screen.getByText(userId)).toBeTruthy();
    expect(getFullUserByIdForUserContextWithRetries).toHaveBeenCalledWith(userId);
    expect(mockRouter.replace).toHaveBeenCalledWith("/organiser/v2");
  });

  it("waits for staged cleanup on direct protected-route entry", async () => {
    const userId = "staged-user" as UserId;
    const profile = { ...EmptyUserData, userId };
    const promotion = deferred<void>();
    jest.mocked(migrateTempUserToActiveUser).mockReturnValue(promotion.promise);
    jest.mocked(getFullUserByIdForUserContextWithRetries).mockResolvedValue(profile);
    render(<UserContext><CurrentUser /></UserContext>);
    let loading!: Promise<void>;
    act(() => {
      mockAuth.currentUser = firebaseUser(userId);
      loading = mockAuthListener(mockAuth.currentUser);
    });
    await waitFor(() => expect(migrateTempUserToActiveUser).toHaveBeenCalledWith(userId));
    expect(screen.getByText("loading")).toBeTruthy();
    expect(mockRouter.replace).not.toHaveBeenCalled();
    await act(async () => { promotion.resolve(); await loading; });
    expect(screen.getByText(userId)).toBeTruthy();
    expect(migrateTempUserToActiveUser).toHaveBeenCalledTimes(1);
  });

  it("does not return to a protected task when profile promotion fails", async () => {
    const userId = "staged-user" as UserId;
    jest.mocked(migrateTempUserToActiveUser).mockRejectedValueOnce(new Error("Promotion failed"));
    window.history.replaceState({}, "", "/login?returnTo=%2Forganiser%2Fv2");
    render(<UserContext><AuthPageNavigation /></UserContext>);
    await act(async () => {
      mockAuth.currentUser = firebaseUser(userId);
      await mockAuthListener(mockAuth.currentUser);
    });
    expect(mockRouter.push).toHaveBeenCalledWith("/error");
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("keeps the social profile path independent of temporary email users", async () => {
    const userId = "social-user" as UserId;
    const profile = { ...EmptyUserData, userId };
    jest.mocked(isSocialAuthUser).mockReturnValue(true);
    jest.mocked(getFullUserByIdForUserContextWithRetries)
      .mockRejectedValueOnce(new UserNotFoundError(userId))
      .mockResolvedValueOnce(profile);
    jest.mocked(ensureActiveUserFromAuth).mockResolvedValue(userId);
    render(<UserContext><CurrentUser /></UserContext>);
    await act(async () => {
      mockAuth.currentUser = firebaseUser(userId);
      await mockAuthListener(mockAuth.currentUser);
    });
    expect(ensureActiveUserFromAuth).toHaveBeenCalledTimes(1);
    expect(migrateTempUserToActiveUser).not.toHaveBeenCalled();
    expect(screen.getByText(userId)).toBeTruthy();
  });

  it("discards an earlier account's profile result without clearing the newer account's loading state", async () => {
    const earlier = deferred<void>();
    const current = deferred<void>();
    const earlierId = "earlier-account" as UserId;
    const currentId = "current-account" as UserId;
    jest.mocked(migrateTempUserToActiveUser)
      .mockReturnValueOnce(earlier.promise)
      .mockReturnValueOnce(current.promise);
    jest.mocked(getFullUserByIdForUserContextWithRetries).mockImplementation((userId) => Promise.resolve({
      ...EmptyUserData, userId,
    }));
    render(<UserContext><CurrentUser /></UserContext>);
    let earlierLoad!: Promise<void>;
    let currentLoad!: Promise<void>;
    act(() => {
      mockAuth.currentUser = firebaseUser(earlierId);
      earlierLoad = mockAuthListener(mockAuth.currentUser);
      mockAuth.currentUser = firebaseUser(currentId);
      currentLoad = mockAuthListener(mockAuth.currentUser);
    });
    await act(async () => { earlier.resolve(); await earlierLoad; });
    expect(screen.getByText("loading")).toBeTruthy();
    expect(mockRouter.replace).not.toHaveBeenCalled();
    await act(async () => { current.resolve(); await currentLoad; });
    expect(screen.getByText(currentId)).toBeTruthy();
    expect(screen.queryByText(earlierId)).toBeNull();
  });

  it("does not restore an account's profile when it resolves after sign-out", async () => {
    const promotion = deferred<void>();
    const userId = "signed-out-account" as UserId;
    jest.mocked(migrateTempUserToActiveUser).mockReturnValue(promotion.promise);
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
    await act(async () => { promotion.resolve(); await loading; });
    expect(getFullUserByIdForUserContextWithRetries).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByText("signed out")).toBeTruthy());
    expect(screen.queryByText(userId)).toBeNull();
    expect(mockRouter.push).not.toHaveBeenCalledWith("/error");
    expect(mockRouter.replace).not.toHaveBeenCalledWith("/error");
  });
});
