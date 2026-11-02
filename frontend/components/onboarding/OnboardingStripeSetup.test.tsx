/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Auth } from "firebase/auth";
import { useUser } from "@/components/utility/UserContext";
import { EmptyUserData, UserId } from "@/interfaces/UserTypes";
import { getStripeStandardAccountSetupLink } from "@/services/src/stripe/stripeService";
import { redirectToExternalUrl } from "@/services/src/urlUtils";
import OnboardingStripeSetup from "./OnboardingStripeSetup";

jest.mock("@/components/utility/UserContext", () => ({ useUser: jest.fn() }));
jest.mock("@/services/src/stripe/stripeService", () => ({ getStripeStandardAccountSetupLink: jest.fn() }));
jest.mock("@/services/src/urlUtils", () => ({
  getUrlWithCurrentHostname: (path: string) => `http://localhost:3000${path}`,
  redirectToExternalUrl: jest.fn(),
}));

const openStripe = jest.mocked(getStripeStandardAccountSetupLink);
const navigate = jest.mocked(redirectToExternalUrl);
let auth: Auth;

function deferred() {
  let resolve!: (value: string) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<string>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}

beforeEach(() => {
  jest.clearAllMocks();
  openStripe.mockReset();
  navigate.mockReset();
  window.scrollTo = jest.fn();
  auth = { currentUser: { uid: "organiser-1" } } as Auth;
  jest.mocked(useUser).mockReturnValue({
    user: { ...EmptyUserData, userId: "organiser-1" as UserId },
    setUser: jest.fn(),
    userLoading: false,
    refreshUser: jest.fn(),
    auth,
  });
});

it("keeps optional setup usable after failure and only retries when requested", async () => {
  const pending = deferred();
  openStripe.mockReturnValueOnce(pending.promise).mockResolvedValueOnce("https://connect.stripe.com/setup/test");
  const view = render(<OnboardingStripeSetup userId="organiser-1" userLoading={false} />);
  const connect = screen.getByRole("button", { name: "Connect payouts" });
  expect(openStripe).not.toHaveBeenCalled();
  act(() => {
    fireEvent.click(connect);
    fireEvent.click(connect);
  });
  expect(openStripe).toHaveBeenCalledTimes(1);
  expect(connect).toBeDisabled();
  expect(screen.getByRole("status")).toHaveTextContent("Opening Stripe...");

  await act(async () => { pending.reject(new Error("private provider failure")); });
  expect(screen.getByRole("alert")).toHaveTextContent("Setup may have started");
  expect(screen.getByText("Free sessions don't need this.")).toBeInTheDocument();
  expect(screen.queryByText("private provider failure")).not.toBeInTheDocument();
  expect(navigate).not.toHaveBeenCalled();
  expect(openStripe).toHaveBeenCalledTimes(1);

  view.rerender(<OnboardingStripeSetup userId="organiser-1" userLoading />);
  const retry = screen.getByRole("button", { name: "Try opening Stripe again" });
  expect(retry).toBeDisabled();
  fireEvent.click(retry);
  expect(openStripe).toHaveBeenCalledTimes(1);
  view.rerender(<OnboardingStripeSetup userId="organiser-1" userLoading={false} />);
  fireEvent.click(screen.getByRole("button", { name: "Try opening Stripe again" }));
  await waitFor(() => expect(navigate).toHaveBeenCalledWith("https://connect.stripe.com/setup/test"));
  expect(openStripe).toHaveBeenNthCalledWith(2, "organiser-1", "http://localhost:3000/onboarding/organiser", "http://localhost:3000/stripe/refreshAccountLink");
  expect(screen.getByRole("button", { name: "Opening Stripe..." })).toBeDisabled();
});

it("releases the guard when navigation throws", async () => {
  openStripe.mockResolvedValue("https://connect.stripe.com/setup/test");
  navigate.mockImplementationOnce(() => { throw new Error("navigation unavailable"); });
  render(<OnboardingStripeSetup userId="organiser-1" userLoading={false} />);
  fireEvent.click(screen.getByRole("button", { name: "Connect payouts" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("We couldn't open Stripe");

  fireEvent.click(screen.getByRole("button", { name: "Try opening Stripe again" }));
  await waitFor(() => expect(navigate).toHaveBeenCalledTimes(2));
});

it.each(["unmount", "account change"])("suppresses a late redirect after %s", async (change) => {
  const pending = deferred();
  openStripe.mockReturnValueOnce(pending.promise);
  const view = render(<OnboardingStripeSetup userId="organiser-1" userLoading={false} />);
  fireEvent.click(screen.getByRole("button", { name: "Connect payouts" }));
  if (change === "unmount") view.unmount();
  else view.rerender(<OnboardingStripeSetup userId="organiser-2" userLoading={false} />);

  await act(async () => { pending.resolve("https://connect.stripe.com/setup/old"); });
  expect(navigate).not.toHaveBeenCalled();
  expect(openStripe).toHaveBeenCalledTimes(1);
});

it.each([
  ["account replacement", "resolve"],
  ["account replacement", "reject"],
  ["sign-out", "resolve"],
  ["sign-out", "reject"],
] as const)("checks live auth and recovers before an account rerender after %s (%s)", async (change, completion) => {
  const pending = deferred();
  const nextPending = deferred();
  openStripe.mockReturnValueOnce(pending.promise).mockReturnValueOnce(nextPending.promise);
  const view = render(<OnboardingStripeSetup userId="organiser-1" userLoading={false} />);
  const connect = screen.getByRole("button", { name: "Connect payouts" });
  const nextAuthUser = change === "account replacement" ? { uid: "organiser-2" } : null;

  Object.assign(auth, { currentUser: nextAuthUser });
  fireEvent.click(connect);
  expect(openStripe).not.toHaveBeenCalled();

  Object.assign(auth, { currentUser: { uid: "organiser-1" } });
  fireEvent.click(connect);
  expect(openStripe).toHaveBeenCalledTimes(1);
  await act(async () => {
    Object.assign(auth, { currentUser: nextAuthUser });
    if (completion === "resolve") pending.resolve("https://connect.stripe.com/setup/old");
    else pending.reject(new Error("old account failure"));
    await pending.promise.catch(() => undefined);
    Object.assign(auth, { currentUser: { uid: "organiser-1" } });
  });
  view.rerender(<OnboardingStripeSetup userId="organiser-1" userLoading={false} />);

  expect(navigate).not.toHaveBeenCalled();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(openStripe).toHaveBeenCalledTimes(1);

  const currentConnect = screen.getByRole("button", { name: "Connect payouts" });
  expect(currentConnect).toBeEnabled();
  fireEvent.click(currentConnect);
  expect(openStripe).toHaveBeenCalledTimes(2);
  expect(openStripe).toHaveBeenNthCalledWith(2, "organiser-1", "http://localhost:3000/onboarding/organiser", "http://localhost:3000/stripe/refreshAccountLink");
  await act(async () => { nextPending.resolve("https://connect.stripe.com/setup/current"); });
  expect(navigate).toHaveBeenCalledWith("https://connect.stripe.com/setup/current");
});

it("retains the navigation guard until the owner leaves, including readiness refreshes", async () => {
  const pending = deferred();
  openStripe.mockReturnValueOnce(pending.promise);
  const view = render(<OnboardingStripeSetup userId="organiser-1" userLoading={false} />);
  fireEvent.click(screen.getByRole("button", { name: "Connect payouts" }));
  view.rerender(<OnboardingStripeSetup userId="organiser-1" userLoading />);
  view.rerender(<OnboardingStripeSetup userId="organiser-1" userLoading={false} />);

  fireEvent.click(screen.getByRole("button", { name: "Opening Stripe..." }));
  expect(openStripe).toHaveBeenCalledTimes(1);
  await act(async () => { pending.resolve("https://connect.stripe.com/setup/test"); });
  expect(navigate).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Opening Stripe..." }));
  expect(openStripe).toHaveBeenCalledTimes(1);
});
