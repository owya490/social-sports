/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { ComponentProps, Dispatch, SetStateAction, useEffect, useState } from "react";
import { Auth } from "firebase/auth";
import OrganiserSettingsV2Page from "@/app/(no-footer)/organiser/v2/settings/page";
import { useUser } from "@/components/utility/UserContext";
import { EmptyUserData, UserData, UserId } from "@/interfaces/UserTypes";
import { getStripeAccId, getStripeStandardAccountSetupLink } from "@/services/src/stripe/stripeService";
import { redirectToExternalUrl } from "@/services/src/urlUtils";
import { updateUser } from "@/services/src/users/usersService";
import { SettingsStripePanel } from "./SettingsStripePanel";

jest.mock("@/components/utility/UserContext", () => ({ useUser: jest.fn() }));
jest.mock("@/services/src/stripe/stripeService", () => ({ getStripeAccId: jest.fn(), getStripeStandardAccountSetupLink: jest.fn() }));
jest.mock("@/services/src/users/usersService", () => ({ updateUser: jest.fn() }));
jest.mock("@/services/src/urlUtils", () => ({
  getUrlWithCurrentHostname: (path: string) => `http://localhost:3000${path}`,
  redirectToExternalUrl: jest.fn(),
}));
jest.mock("@/observability/logger", () => ({ Logger: jest.fn(() => ({ error: jest.fn() })) }));
jest.mock("next/image", () => ({ __esModule: true, default: () => null }));
jest.mock("@/public/images/stripe-logo.svg", () => "stripe-logo");
jest.mock("./SportshubStripeIntegrationIcon", () => ({ SportshubStripeIntegrationIcon: () => null }));
jest.mock("./SettingsHeader", () => ({ SettingsHeader: ({ subtitle }: { subtitle: string }) => <h1>{subtitle}</h1> }));

const openStripe = jest.mocked(getStripeStandardAccountSetupLink);
const readStripeId = jest.mocked(getStripeAccId);
const navigate = jest.mocked(redirectToExternalUrl);
const firstUser: UserData = { ...EmptyUserData, userId: "organiser-1" as UserId };
const props: ComponentProps<typeof SettingsStripePanel> = {
  stripeId: "acct_1",
  stripeLoading: false,
  stripeError: false,
  onRetryStripeStatus: jest.fn(),
  userId: firstUser.userId,
  userLoading: false,
};
let replaceUser: Dispatch<SetStateAction<UserData>>;
let setUserLoading: Dispatch<SetStateAction<boolean>>;
let auth: Auth;

function mockUserContext(user = firstUser, setUser: Dispatch<SetStateAction<UserData>> = jest.fn(), userLoading = false) {
  jest.mocked(useUser).mockReturnValue({ user, setUser, userLoading, auth, refreshUser: jest.fn() });
}

function PageHarness() {
  const [user, setUser] = useState(firstUser);
  const [userLoading, updateUserLoading] = useState(false);
  useEffect(() => {
    replaceUser = setUser;
    setUserLoading = updateUserLoading;
  }, [setUser]);
  mockUserContext(user, setUser, userLoading);
  return <OrganiserSettingsV2Page />;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}

beforeEach(() => {
  jest.clearAllMocks();
  openStripe.mockReset();
  readStripeId.mockReset();
  navigate.mockReset();
  window.scrollTo = jest.fn();
  auth = { currentUser: { uid: "organiser-1" } } as Auth;
  mockUserContext();
});

it.each(["setup", "resync"] as const)("guards setup and resync together and retries the original %s return path", async (action) => {
  const pending = deferred<string>();
  openStripe.mockReturnValueOnce(pending.promise).mockResolvedValueOnce("https://connect.stripe.com/setup/test");
  const view = render(<SettingsStripePanel {...props} />);
  const setup = screen.getByRole("button", { name: "Continue Stripe setup" });
  const resync = screen.getByRole("button", { name: "Resync Stripe account" });
  expect(openStripe).not.toHaveBeenCalled();

  act(() => {
    fireEvent.click(action === "setup" ? setup : resync);
    fireEvent.click(action === "setup" ? resync : setup);
  });
  expect(openStripe).toHaveBeenCalledTimes(1);
  expect(setup).toBeDisabled();
  expect(resync).toBeDisabled();
  expect(screen.getByRole("status")).toHaveTextContent("Opening Stripe...");
  const returnPath = action === "setup" ? "/organiser/v2/dashboard" : "/organiser/v2/settings";
  expect(openStripe).toHaveBeenCalledWith(firstUser.userId, `http://localhost:3000${returnPath}`, "http://localhost:3000/stripe/refreshAccountLink");

  await act(async () => { pending.reject(new Error("provider details")); });
  expect(screen.getByRole("alert")).toHaveTextContent("Setup may have started");
  expect(screen.queryByText("provider details")).not.toBeInTheDocument();
  expect(navigate).not.toHaveBeenCalled();
  view.rerender(<SettingsStripePanel {...props} stripeLoading />);
  const retry = screen.getByRole("button", { name: "Try opening Stripe again" });
  expect(retry).toBeDisabled();
  fireEvent.click(retry);
  expect(openStripe).toHaveBeenCalledTimes(1);
  view.rerender(<SettingsStripePanel {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "Try opening Stripe again" }));
  await waitFor(() => expect(navigate).toHaveBeenCalledWith("https://connect.stripe.com/setup/test"));
  expect(openStripe).toHaveBeenNthCalledWith(2, firstUser.userId, `http://localhost:3000${returnPath}`, "http://localhost:3000/stripe/refreshAccountLink");
  expect(navigate).toHaveBeenCalledWith("https://connect.stripe.com/setup/test");
  const currentResync = screen.getByRole("button", { name: "Resync Stripe account" });
  expect(currentResync).toBeDisabled();
  fireEvent.click(currentResync);
  expect(openStripe).toHaveBeenCalledTimes(2);
});

it("recovers locally when navigation throws", async () => {
  openStripe.mockResolvedValue("https://connect.stripe.com/setup/test");
  navigate.mockImplementationOnce(() => { throw new Error("navigation unavailable"); });
  render(<SettingsStripePanel {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "Continue Stripe setup" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("We couldn't open Stripe");
  fireEvent.click(screen.getByRole("button", { name: "Try opening Stripe again" }));
  await waitFor(() => expect(navigate).toHaveBeenCalledTimes(2));
});

it.each(["unmount", "account change"])("suppresses late setup navigation after %s", async (change) => {
  const pending = deferred<string>();
  openStripe.mockReturnValueOnce(pending.promise);
  const view = render(<SettingsStripePanel {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "Continue Stripe setup" }));
  if (change === "unmount") {
    view.unmount();
  } else {
    Object.assign(auth, { currentUser: { uid: "organiser-2" } });
    mockUserContext({ ...firstUser, userId: "organiser-2" as UserId });
    view.rerender(<SettingsStripePanel {...props} userId="organiser-2" />);
  }

  await act(async () => { pending.resolve("https://connect.stripe.com/setup/old"); });
  expect(navigate).not.toHaveBeenCalled();
});

it.each(["setup", "resync"] as const)("suppresses late %s navigation while the next account's profile is loading", async (action) => {
  const pending = deferred<string>();
  readStripeId.mockResolvedValue("acct_1");
  openStripe.mockReturnValueOnce(pending.promise);
  render(<PageHarness />);
  fireEvent.click(await screen.findByRole("button", { name: action === "setup" ? "Continue Stripe setup" : "Resync Stripe account" }));

  act(() => {
    Object.assign(auth, { currentUser: { uid: "organiser-2" } });
    setUserLoading(true);
  });
  await act(async () => { pending.resolve("https://connect.stripe.com/setup/old"); });

  expect(navigate).not.toHaveBeenCalled();
  expect(readStripeId).toHaveBeenCalledTimes(1);
  expect(screen.queryByText("Opening Stripe...")).not.toBeInTheDocument();
});

it("checks live auth before dispatch and completion even before the next render", async () => {
  const pending = deferred<string>();
  openStripe.mockReturnValueOnce(pending.promise);
  render(<SettingsStripePanel {...props} />);
  const setup = screen.getByRole("button", { name: "Continue Stripe setup" });
  const resync = screen.getByRole("button", { name: "Resync Stripe account" });

  Object.assign(auth, { currentUser: { uid: "organiser-2" } });
  fireEvent.click(setup);
  fireEvent.click(resync);
  expect(openStripe).not.toHaveBeenCalled();

  Object.assign(auth, { currentUser: { uid: firstUser.userId } });
  fireEvent.click(setup);
  expect(openStripe).toHaveBeenCalledTimes(1);
  Object.assign(auth, { currentUser: { uid: "organiser-2" } });
  await act(async () => { pending.resolve("https://connect.stripe.com/setup/old"); });
  expect(navigate).not.toHaveBeenCalled();
});

it("blocks account-status reads and Stripe requests when auth and the loaded profile disagree", () => {
  Object.assign(auth, { currentUser: { uid: "organiser-2" } });
  const view = render(<SettingsStripePanel {...props} />);
  const setup = screen.getByRole("button", { name: "Continue Stripe setup" });
  const resync = screen.getByRole("button", { name: "Resync Stripe account" });
  expect(setup).toBeDisabled();
  expect(resync).toBeDisabled();
  fireEvent.click(setup);
  fireEvent.click(resync);
  expect(openStripe).not.toHaveBeenCalled();
  view.unmount();

  render(<PageHarness />);
  expect(readStripeId).not.toHaveBeenCalled();
  expect(screen.queryByRole("button", { name: /Connect Stripe|Continue Stripe setup|Resync Stripe account/ })).not.toBeInTheDocument();
});

it("keeps the in-flight link guard through a same-account readiness refresh", async () => {
  const pending = deferred<string>();
  readStripeId.mockResolvedValue("acct_1");
  openStripe.mockReturnValueOnce(pending.promise);
  render(<PageHarness />);
  fireEvent.click(await screen.findByRole("button", { name: "Continue Stripe setup" }));
  const panel = screen.getByRole("region", { name: "Stripe payments" });

  act(() => { setUserLoading(true); });
  expect(within(screen.getByRole("region", { name: "Stripe payments" })).getByRole("status")).toHaveTextContent("Opening Stripe...");
  act(() => { setUserLoading(false); });
  const resync = await screen.findByRole("button", { name: "Resync Stripe account" });
  const setup = screen.getByRole("button", { name: "Opening Stripe..." });
  expect(screen.getByRole("region", { name: "Stripe payments" })).toBe(panel);
  expect(setup).toBeDisabled();
  expect(resync).toBeDisabled();
  fireEvent.click(setup);
  fireEvent.click(resync);
  expect(openStripe).toHaveBeenCalledTimes(1);

  await act(async () => { pending.resolve("https://connect.stripe.com/setup/current"); });
  expect(navigate).toHaveBeenCalledWith("https://connect.stripe.com/setup/current");
});

it.each(["resolve", "reject"] as const)("disposes the old preference owner when auth changes before profile loading (%s)", async (completion) => {
  const pending = deferred<void>();
  readStripeId.mockResolvedValue("");
  jest.mocked(updateUser).mockReturnValueOnce(pending.promise);
  render(<PageHarness />);
  await screen.findByRole("button", { name: "Connect Stripe" });
  const oldToggle = screen.getByRole("switch");
  fireEvent.click(oldToggle);

  act(() => {
    Object.assign(auth, { currentUser: { uid: "organiser-2" } });
    setUserLoading(true);
  });
  const currentToggle = screen.getByRole("switch");
  expect(currentToggle).not.toBe(oldToggle);
  expect(currentToggle).toBeDisabled();
  await act(async () => {
    if (completion === "resolve") pending.resolve(undefined);
    else pending.reject(new Error("old account failure"));
  });

  expect(currentToggle).toHaveAttribute("aria-checked", "true");
  expect(screen.queryByText("Saved")).not.toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
  expect(updateUser).toHaveBeenCalledTimes(1);
});

it("shows unavailable status instead of offering an unconnected-account setup", () => {
  render(<SettingsStripePanel {...props} stripeError />);

  expect(screen.getByRole("alert")).toHaveTextContent("Status unavailable");
  expect(screen.queryByRole("button", { name: /Connect Stripe|Continue Stripe setup|Resync Stripe account/ })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Retry loading Stripe status" }));
  expect(props.onRetryStripeStatus).toHaveBeenCalledTimes(1);
  expect(openStripe).not.toHaveBeenCalled();
});

it("keeps email preference state mounted during setup failure without refetching Stripe status", async () => {
  const link = deferred<string>();
  const preference = deferred<void>();
  readStripeId.mockResolvedValue("");
  openStripe.mockReturnValueOnce(link.promise);
  jest.mocked(updateUser).mockReturnValueOnce(preference.promise);
  render(<PageHarness />);
  const connect = await screen.findByRole("button", { name: "Connect Stripe" });
  const toggle = screen.getByRole("switch");
  fireEvent.click(toggle);
  fireEvent.click(connect);
  expect(screen.getByRole("switch")).toBe(toggle);
  expect(toggle).toHaveAttribute("aria-checked", "true");

  await act(async () => { link.reject(new Error("link unavailable")); });
  expect(screen.getByRole("switch")).toBe(toggle);
  expect(toggle).toBeDisabled();
  expect(within(screen.getByRole("region", { name: "Stripe payments" })).getByRole("alert")).toHaveTextContent("Setup may have started");
  await act(async () => { preference.resolve(undefined); });
  expect(toggle).toHaveAttribute("aria-checked", "true");
  expect(await screen.findByText("Saved")).toBeInTheDocument();
  expect(readStripeId).toHaveBeenCalledTimes(1);
});

it.each([
  ["account replacement", "resolve"],
  ["account replacement", "reject"],
  ["signout", "resolve"],
  ["signout", "reject"],
] as const)("recovers a discarded Stripe status read after %s without remounting (%s)", async (change, completion) => {
  const pending = deferred<string>();
  readStripeId.mockReturnValueOnce(pending.promise).mockResolvedValueOnce("acct_current");
  render(<PageHarness />);
  const panel = screen.getByRole("region", { name: "Stripe payments" });
  const toggle = screen.getByRole("switch");

  await act(async () => {
    Object.assign(auth, { currentUser: change === "signout" ? null : { uid: "organiser-2" } });
    if (completion === "resolve") pending.resolve("acct_discarded");
    else pending.reject(new Error("discarded account failure"));
    await pending.promise.catch(() => undefined);
    Object.assign(auth, { currentUser: { uid: firstUser.userId } });
  });

  expect(screen.getByRole("region", { name: "Stripe payments" })).toBe(panel);
  expect(screen.getByRole("switch")).toBe(toggle);
  expect(within(panel).getByRole("alert")).toHaveTextContent("Status unavailable");
  expect(screen.queryByText("acct_discarded")).not.toBeInTheDocument();
  expect(screen.queryByText("Connected")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Connect Stripe|Continue Stripe setup|Resync Stripe account/ })).not.toBeInTheDocument();
  expect(readStripeId).toHaveBeenCalledTimes(1);
  const retry = screen.getByRole("button", { name: "Retry loading Stripe status" });
  expect(retry).toBeEnabled();
  fireEvent.click(retry);

  expect(await screen.findByText("acct_current")).toBeInTheDocument();
  expect(screen.getByRole("switch")).toBe(toggle);
  expect(readStripeId).toHaveBeenNthCalledWith(2, firstUser.userId);
  expect(readStripeId).toHaveBeenCalledTimes(2);
  expect(openStripe).not.toHaveBeenCalled();
  expect(navigate).not.toHaveBeenCalled();
});

it("retries account-status reads separately from setup and ignores a replaced account's late read", async () => {
  const oldRead = deferred<string>();
  readStripeId.mockReturnValueOnce(oldRead.promise).mockRejectedValueOnce(new Error("read unavailable")).mockResolvedValueOnce("acct_current");
  render(<PageHarness />);
  act(() => {
    Object.assign(auth, { currentUser: { uid: "organiser-2" } });
    replaceUser({ ...firstUser, userId: "organiser-2" as UserId });
  });
  expect(await screen.findByText("Status unavailable")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Connect Stripe" })).not.toBeInTheDocument();
  act(() => {
    fireEvent.click(screen.getByRole("button", { name: "Retry loading Stripe status" }));
    fireEvent.click(screen.getByRole("button", { name: "Retry loading Stripe status" }));
  });
  expect(await screen.findByText("acct_current")).toBeInTheDocument();
  await act(async () => { oldRead.resolve("acct_old"); });

  expect(screen.queryByText("acct_old")).not.toBeInTheDocument();
  expect(readStripeId).toHaveBeenNthCalledWith(3, "organiser-2");
  expect(readStripeId).toHaveBeenCalledTimes(3);
  expect(openStripe).not.toHaveBeenCalled();
});
