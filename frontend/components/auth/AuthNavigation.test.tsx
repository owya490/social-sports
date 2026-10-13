/** @jest-environment jsdom */
import React, { ReactNode } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import Login from "@/app/(no-footer)/login/page";
import Register from "@/app/(no-footer)/register/page";
import ResetPassword from "@/app/(footer)/resetPassword/page";
import { EmptyUserData, UserData, UserId } from "@/interfaces/UserTypes";
import { User } from "firebase/auth";
import {
  getTempUserData,
  handleEmailAndPasswordSignIn,
  handleEmailAndPasswordSignUp,
  handleGoogleSignIn,
  resetUserPassword,
} from "@/services/src/auth/authService";
import { getFullUserById } from "@/services/src/users/usersService";
import SocialAuthButtons from "./SocialAuthButtons";

const mockRouter = { replace: jest.fn(), push: jest.fn() };
const mockSetUser = jest.fn();
const mockAuth: { currentUser: User | null } = { currentUser: null };
let mockUserLoading = false;
let mockUser = EmptyUserData as UserData;

jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => window.location.pathname,
  useSearchParams: () => new URLSearchParams(window.location.search),
}));
jest.mock("next/link", () => ({
  __esModule: true,
  default: (props: React.ComponentProps<"a">) => <a {...props} />,
}));
jest.mock("@/components/utility/UserContext", () => ({
  useUser: () => ({ user: mockUser, userLoading: mockUserLoading, setUser: mockSetUser, auth: mockAuth }),
}));
jest.mock("@/services/src/firebase", () => ({ auth: { get currentUser() { return mockAuth.currentUser; } } }));
jest.mock("@/services/src/auth/authService", () => ({
  getTempUserData: jest.fn(),
  handleEmailAndPasswordSignIn: jest.fn(),
  handleEmailAndPasswordSignUp: jest.fn(),
  handleGoogleSignIn: jest.fn(),
  handleAppleSignIn: jest.fn(),
  handleFacebookSignIn: jest.fn(),
  resetUserPassword: jest.fn(),
}));
jest.mock("@/services/src/users/usersService", () => ({ getFullUserById: jest.fn() }));
jest.mock("@/observability/logger", () => ({ Logger: jest.fn(() => ({ error: jest.fn() })) }));
jest.mock("@/utilities/sleepUtil", () => ({ sleep: jest.fn().mockResolvedValue(undefined) }));
jest.mock("@/components/auth/AuthSplitLayout", () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  AUTH_INPUT_CLASS: "",
  AUTH_LABEL_CLASS: "",
  AUTH_SUBMIT_CLASS: "",
}));
jest.mock("@material-tailwind/react", () => ({
  Alert: ({ open, children, onClose }: { open: boolean; children: ReactNode; onClose: () => void }) =>
    open ? <div role="alert">{children}<button onClick={onClose}>Close alert</button></div> : null,
}));

const userId = "organiser-1" as UserId;
const profile = { ...EmptyUserData, userId, username: "organiser" };
const destination = "/organiser/v2/event/one?tab=tickets&filter=paid#ticket-types";
const loginHref = `/login?returnTo=${encodeURIComponent(destination)}`;

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function signedIn(id = userId) {
  mockAuth.currentUser = { uid: id, emailVerified: true } as User;
  mockUser = { ...profile, userId: id };
}

function submitEmail(container: HTMLElement) {
  fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "host@example.com" } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
  fireEvent.submit(container.querySelector("form")!);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.currentUser = null;
  mockUserLoading = false;
  mockUser = EmptyUserData as UserData;
  window.history.replaceState({}, "", loginHref);
  jest.mocked(getTempUserData).mockResolvedValue(null);
  jest.mocked(getFullUserById).mockResolvedValue(profile);
  jest.mocked(handleEmailAndPasswordSignUp).mockResolvedValue(undefined);
  jest.mocked(resetUserPassword).mockResolvedValue(undefined);
});

describe("auth page destinations", () => {
  it("returns email sign-in to the full destination only after profile loading", async () => {
    const signIn = deferred<UserId>();
    const user = deferred<UserData>();
    jest.mocked(handleEmailAndPasswordSignIn).mockReturnValue(signIn.promise);
    jest.mocked(getFullUserById).mockReturnValue(user.promise);
    const { container } = render(<Login />);
    expect(screen.getByText("Forgot password?").getAttribute("href")).toBe(`/resetPassword?returnTo=${encodeURIComponent(destination)}`);
    expect(screen.getByText("Register here").getAttribute("href")).toBe(`/register?returnTo=${encodeURIComponent(destination)}`);

    submitEmail(container);
    expect(handleEmailAndPasswordSignIn).toHaveBeenCalledWith("host@example.com", "password123", destination);
    await act(async () => { signedIn(); signIn.resolve(userId); await signIn.promise; });
    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect((screen.getByRole("button", { name: "Continue with Google" }) as HTMLButtonElement).disabled).toBe(true);

    await act(async () => { user.resolve(profile); await user.promise; });
    expect(mockSetUser).toHaveBeenCalledWith(profile);
    expect(mockRouter.replace).toHaveBeenCalledWith(destination);
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it.each([["login", Login], ["register", Register]] as const)("completes Google sign-in from %s at the requested destination", async (path, Page) => {
    const signIn = deferred<UserId | null>();
    jest.mocked(handleGoogleSignIn).mockReturnValue(signIn.promise);
    window.history.replaceState({}, "", `/${path}?returnTo=${encodeURIComponent(destination)}`);
    render(<Page />);
    fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));
    await act(async () => { signedIn(); signIn.resolve(userId); await signIn.promise; });
    expect(mockSetUser).toHaveBeenCalledWith(profile);
    expect(mockRouter.replace).toHaveBeenCalledWith(destination);
  });

  it("keeps registration and reset recovery links and service calls scoped to the destination", async () => {
    window.history.replaceState({}, "", `/register?returnTo=${encodeURIComponent(destination)}`);
    const registration = render(<Register />);
    expect(screen.getByText("Login here").getAttribute("href")).toBe(loginHref);
    fireEvent.change(screen.getByLabelText("First Name"), { target: { value: "Host" } });
    fireEvent.change(screen.getByLabelText("Repeat Password"), { target: { value: "password123" } });
    submitEmail(registration.container);
    await screen.findByText("Email sent. Please check your inbox.");
    expect(handleEmailAndPasswordSignUp).toHaveBeenCalledWith(expect.objectContaining({ firstName: "Host" }), destination);
    expect(mockRouter.replace).not.toHaveBeenCalled();
    registration.unmount();

    window.history.replaceState({}, "", `/resetPassword?returnTo=${encodeURIComponent(destination)}`);
    const reset = render(<ResetPassword />);
    expect(screen.getByText("Return back to login").getAttribute("href")).toBe(loginHref);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "host@example.com" } });
    fireEvent.submit(reset.container.querySelector("form")!);
    await screen.findByText("Request sent, please check your email");
    expect(resetUserPassword).toHaveBeenCalledWith("host@example.com", destination);
  });

  it.each(["", "?returnTo=https%3A%2F%2Fevil.example%2Forganiser"])(
    "uses the existing manual-success fallback for missing or unsafe intent (%s)", async (query) => {
      window.history.replaceState({}, "", `/login${query}`);
      jest.mocked(handleEmailAndPasswordSignIn).mockImplementation(() => { signedIn(); return Promise.resolve(userId); });
      const { container } = render(<Login />);
      submitEmail(container);
      await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/?login=success"));
      expect(handleEmailAndPasswordSignIn).toHaveBeenCalledWith("host@example.com", "password123", null);
      expect(screen.getByText("Register here").getAttribute("href")).toBe("/register");
    },
  );
});

describe("auth navigation races", () => {
  it.each([false, true])("only automatically returns active users without a staged signup (staged: %s)", async (staged) => {
    signedIn();
    const signup = deferred<UserData | null>();
    jest.mocked(getTempUserData).mockReturnValue(signup.promise);
    render(<Login />);
    await act(async () => { signup.resolve(staged ? profile : null); await signup.promise; });
    if (staged) expect(mockRouter.replace).not.toHaveBeenCalled();
    else expect(mockRouter.replace).toHaveBeenCalledWith(destination);
  });

  it("waits for context readiness before automatic entry, retaining its homepage fallback", async () => {
    signedIn();
    mockUserLoading = true;
    window.history.replaceState({}, "", "/login");
    const page = render(<Login />);
    expect(getTempUserData).not.toHaveBeenCalled();
    mockUserLoading = false;
    page.rerender(<Login />);
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/"));
  });

  it.each(["email failure", "Google cancellation"])("does not let a delayed automatic check override %s", async (attempt) => {
    signedIn();
    const staged = deferred<UserData | null>();
    jest.mocked(getTempUserData).mockReturnValue(staged.promise);
    jest.mocked(handleEmailAndPasswordSignIn).mockRejectedValue(new Error("Email is not verified"));
    jest.mocked(handleGoogleSignIn).mockResolvedValue(null);
    const { container } = render(<Login />);
    await waitFor(() => expect(getTempUserData).toHaveBeenCalledWith(userId));

    if (attempt === "email failure") {
      submitEmail(container);
      await screen.findByText("Email is not verified");
    } else {
      fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));
      await waitFor(() => expect((screen.getByRole("button", { name: "Continue with Google" }) as HTMLButtonElement).disabled).toBe(false));
    }
    await act(async () => { staged.resolve(null); await staged.promise; });
    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(screen.getByText("Register here").getAttribute("href")).toBe(`/register?returnTo=${encodeURIComponent(destination)}`);
  });

  it.each(["URL", "account", "unmount"])("ignores an automatic result after %s changes", async (change) => {
    signedIn();
    const staged = deferred<UserData | null>();
    jest.mocked(getTempUserData).mockReturnValue(staged.promise);
    const page = render(<Login />);
    await waitFor(() => expect(getTempUserData).toHaveBeenCalled());
    if (change === "URL") window.history.replaceState({}, "", "/login?returnTo=%2Fprofile");
    if (change === "account") mockAuth.currentUser = { uid: "other", emailVerified: true } as User;
    if (change === "unmount") page.unmount();
    await act(async () => { staged.resolve(null); await staged.promise; });
    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(mockSetUser).not.toHaveBeenCalled();
  });

  it.each(["URL", "account", "unmount"])("ignores a completed profile request after %s changes", async (change) => {
    const user = deferred<UserData>();
    jest.mocked(handleEmailAndPasswordSignIn).mockImplementation(() => { signedIn(); return Promise.resolve(userId); });
    jest.mocked(getFullUserById).mockReturnValue(user.promise);
    const page = render(<Login />);
    submitEmail(page.container);
    await waitFor(() => expect(getFullUserById).toHaveBeenCalledWith(userId));
    if (change === "URL") window.history.replaceState({}, "", "/login?returnTo=%2Fprofile");
    if (change === "account") mockAuth.currentUser = { uid: "other", emailVerified: true } as User;
    if (change === "unmount") page.unmount();
    await act(async () => { user.resolve(profile); await user.promise; });
    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(mockSetUser).not.toHaveBeenCalled();
  });

  it("does not revive an old sign-in when the destination changes away and back", async () => {
    const user = deferred<UserData>();
    jest.mocked(handleEmailAndPasswordSignIn).mockImplementation(() => { signedIn(); return Promise.resolve(userId); });
    jest.mocked(getFullUserById).mockReturnValue(user.promise);
    const page = render(<Login />);
    submitEmail(page.container);
    await waitFor(() => expect(getFullUserById).toHaveBeenCalledWith(userId));
    window.history.replaceState({}, "", "/login?returnTo=%2Fprofile");
    page.rerender(<Login />);
    window.history.replaceState({}, "", loginHref);
    page.rerender(<Login />);

    await act(async () => { user.resolve(profile); await user.promise; });
    expect(mockSetUser).not.toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });
});

describe("social sign-in pending state", () => {
  it.each(["cancel", "failure", "success"])("disables re-entry until %s settles and reports pending synchronously", async (outcome) => {
    const signIn = deferred<UserId | null>();
    const completion = deferred<void>();
    const onPendingChange = jest.fn();
    const onSuccess = jest.fn(() => completion.promise);
    const onError = jest.fn();
    jest.mocked(handleGoogleSignIn).mockImplementation(() => {
      expect(onPendingChange).toHaveBeenLastCalledWith(true);
      return signIn.promise;
    });
    render(<SocialAuthButtons onError={onError} onSuccess={onSuccess} onPendingChange={onPendingChange} />);
    const button = screen.getByRole("button", { name: "Continue with Google" }) as HTMLButtonElement;
    fireEvent.click(button);
    expect(button.disabled).toBe(true);
    fireEvent.click(button);
    expect(handleGoogleSignIn).toHaveBeenCalledTimes(1);
    await act(async () => {
      if (outcome === "failure") signIn.reject(new Error("Popup failed"));
      else signIn.resolve(outcome === "cancel" ? null : userId);
      await signIn.promise.catch(() => null);
    });
    if (outcome === "success") {
      expect(button.disabled).toBe(true);
      expect(onSuccess).toHaveBeenCalledWith(userId);
      await act(async () => { completion.resolve(); await completion.promise; });
    } else expect(onSuccess).not.toHaveBeenCalled();
    expect(button.disabled).toBe(false);
    expect(onPendingChange).toHaveBeenLastCalledWith(false);
    if (outcome === "failure") expect(onError).toHaveBeenCalledWith("Popup failed");
    else expect(onError).not.toHaveBeenCalled();
  });
});
