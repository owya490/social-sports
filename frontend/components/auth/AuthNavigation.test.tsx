/** @jest-environment jsdom */
import React, { ReactNode } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import Login from "@/app/(no-footer)/login/page";
import Register from "@/app/(no-footer)/register/page";
import ResetPassword from "@/app/(footer)/resetPassword/page";
import { EmptyUserData, UserData, UserId } from "@/interfaces/UserTypes";
import { User } from "firebase/auth";
import {
  handleEmailAndPasswordSignIn,
  handleEmailAndPasswordSignUp,
  handleGoogleSignIn,
  resetUserPassword,
} from "@/services/src/auth/authService";
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
  handleEmailAndPasswordSignIn: jest.fn(),
  handleEmailAndPasswordSignUp: jest.fn(),
  handleGoogleSignIn: jest.fn(),
  handleAppleSignIn: jest.fn(),
  handleFacebookSignIn: jest.fn(),
  resetUserPassword: jest.fn(),
}));
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

function authenticated(id = userId) {
  mockAuth.currentUser = { uid: id, emailVerified: true } as User;
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
  jest.mocked(handleEmailAndPasswordSignUp).mockResolvedValue(undefined);
  jest.mocked(resetUserPassword).mockResolvedValue(undefined);
});

describe("auth page destinations", () => {
  it("returns email sign-in to the full destination only after context profile loading", async () => {
    const signIn = deferred<UserId>();
    jest.mocked(handleEmailAndPasswordSignIn).mockReturnValue(signIn.promise);
    const page = render(<Login />);
    expect(screen.getByText("Forgot password?").getAttribute("href")).toBe(`/resetPassword?returnTo=${encodeURIComponent(destination)}`);
    expect(screen.getByText("Register here").getAttribute("href")).toBe(`/register?returnTo=${encodeURIComponent(destination)}`);

    submitEmail(page.container);
    expect(handleEmailAndPasswordSignIn).toHaveBeenCalledWith("host@example.com", "password123", destination);
    await act(async () => { authenticated(); mockUserLoading = true; signIn.resolve(userId); await signIn.promise; });
    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect((screen.getByRole("button", { name: "Continue with Google" }) as HTMLButtonElement).disabled).toBe(true);

    await act(async () => {
      mockUser = profile;
      mockUserLoading = false;
      page.rerender(<Login />);
      await Promise.resolve();
    });
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith(destination));
    expect(mockRouter.replace).toHaveBeenCalledWith(destination);
    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(mockSetUser).not.toHaveBeenCalled();
  });

  it.each([["login", Login], ["register", Register]] as const)("completes Google sign-in from %s at the requested destination", async (path, Page) => {
    const signIn = deferred<UserId | null>();
    jest.mocked(handleGoogleSignIn).mockReturnValue(signIn.promise);
    window.history.replaceState({}, "", `/${path}?returnTo=${encodeURIComponent(destination)}`);
    render(<Page />);
    fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));
    await act(async () => { signedIn(); signIn.resolve(userId); await signIn.promise; });
    expect(mockRouter.replace).toHaveBeenCalledWith(destination);
    expect(mockSetUser).not.toHaveBeenCalled();
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
  it("automatically returns a user after the context profile is ready", async () => {
    signedIn();
    render(<Login />);
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith(destination));
  });

  it("waits for context readiness before automatic entry, retaining its homepage fallback", async () => {
    authenticated();
    mockUserLoading = true;
    window.history.replaceState({}, "", "/login");
    const page = render(<Login />);
    expect(mockRouter.replace).not.toHaveBeenCalled();
    mockUser = profile;
    mockUserLoading = false;
    page.rerender(<Login />);
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/"));
  });

  it.each(["email failure", "Google cancellation"])("does not automatically navigate after %s", async (attempt) => {
    authenticated();
    mockUserLoading = true;
    jest.mocked(handleEmailAndPasswordSignIn).mockRejectedValue(new Error("Email is not verified"));
    jest.mocked(handleGoogleSignIn).mockResolvedValue(null);
    const page = render(<Login />);

    if (attempt === "email failure") {
      submitEmail(page.container);
      await screen.findByText("Email is not verified");
    } else {
      fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));
      await waitFor(() => expect((screen.getByRole("button", { name: "Continue with Google" }) as HTMLButtonElement).disabled).toBe(false));
    }
    mockUser = profile;
    mockUserLoading = false;
    page.rerender(<Login />);
    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(screen.getByText("Register here").getAttribute("href")).toBe(`/register?returnTo=${encodeURIComponent(destination)}`);
  });

  it.each(["URL", "account", "unmount"])("ignores completed sign-in after %s changes", async (change) => {
    mockUserLoading = true;
    jest.mocked(handleEmailAndPasswordSignIn).mockImplementation(() => { authenticated(); return Promise.resolve(userId); });
    const page = render(<Login />);
    submitEmail(page.container);
    await waitFor(() => expect((page.container.querySelector('button[type="submit"]') as HTMLButtonElement).disabled).toBe(true));
    await act(async () => {
      if (change === "URL") {
        window.history.replaceState({}, "", "/login?returnTo=%2Fprofile");
        page.rerender(<Login />);
      }
      if (change === "account") {
        mockAuth.currentUser = { uid: "other", emailVerified: true } as User;
        page.rerender(<Login />);
      }
      if (change === "unmount") page.unmount();
      if (change !== "unmount") {
        mockUser = profile;
        mockUserLoading = false;
        page.rerender(<Login />);
      }
      await Promise.resolve();
    });
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("does not revive an old sign-in when the destination changes away and back", async () => {
    mockUserLoading = true;
    jest.mocked(handleEmailAndPasswordSignIn).mockImplementation(() => { authenticated(); return Promise.resolve(userId); });
    const page = render(<Login />);
    submitEmail(page.container);
    await waitFor(() => expect((page.container.querySelector('button[type="submit"]') as HTMLButtonElement).disabled).toBe(true));
    await act(async () => {
      window.history.replaceState({}, "", "/login?returnTo=%2Fprofile");
      page.rerender(<Login />);
      await Promise.resolve();
    });
    await act(async () => {
      window.history.replaceState({}, "", loginHref);
      page.rerender(<Login />);
      await Promise.resolve();
    });
    await act(async () => {
      mockUser = profile;
      mockUserLoading = false;
      page.rerender(<Login />);
      await Promise.resolve();
    });
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
