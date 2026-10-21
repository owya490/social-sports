/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Dispatch, SetStateAction, useState } from "react";
import { Auth } from "firebase/auth";
import { useUser } from "@/components/utility/UserContext";
import { EmptyUserData, UserData, UserId } from "@/interfaces/UserTypes";
import { updateUser } from "@/services/src/users/usersService";
import { SettingsPreferencesPanel } from "./SettingsPreferencesPanel";

jest.mock("@/components/utility/UserContext", () => ({ useUser: jest.fn() }));
jest.mock("@/services/src/users/usersService", () => ({ updateUser: jest.fn() }));
jest.mock("@/observability/logger", () => ({ Logger: jest.fn(() => ({ error: jest.fn() })) }));

const saveUser = jest.mocked(updateUser);
const firstUser: UserData = { ...EmptyUserData, userId: "organiser-1" as UserId };
const authState: { currentUser: { uid: string } | null } = { currentUser: null };
const auth = authState as Auth;
const globalUserUpdates = jest.fn();
let replaceUser: Dispatch<SetStateAction<UserData>>;
let setUserLoading: Dispatch<SetStateAction<boolean>>;

function Harness() {
  const [user, setUserState] = useState(firstUser);
  const [userLoading, setLoading] = useState(false);
  replaceUser = setUserState;
  setUserLoading = setLoading;
  const setUser: Dispatch<SetStateAction<UserData>> = (update) => {
    globalUserUpdates(update);
    setUserState(update);
  };
  jest.mocked(useUser).mockReturnValue({ user, setUser, userLoading, auth, refreshUser: jest.fn() });
  return <SettingsPreferencesPanel />;
}

function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}

beforeEach(() => {
  jest.resetAllMocks();
  authState.currentUser = { uid: "organiser-1" };
  saveUser.mockResolvedValue(undefined);
});

it("shows pending, restores the prior value on failure and retries the desired value with fresh rollback state", async () => {
  const initial = deferred();
  const retried = deferred();
  let attempts = 0;
  saveUser.mockImplementation(() => ++attempts === 1 ? initial.promise : attempts === 2 ? retried.promise : Promise.resolve());
  render(<Harness />);
  const toggle = screen.getByRole("switch", { name: "Ticket confirmation emails" });

  act(() => {
    fireEvent.click(toggle);
    fireEvent.click(toggle);
  });
  expect(saveUser).toHaveBeenCalledTimes(1);
  expect(toggle).toHaveAttribute("aria-checked", "true");
  expect(toggle).toBeDisabled();
  expect(screen.getByRole("status")).toHaveTextContent("Saving changes");

  await act(async () => { initial.reject(new Error("private failure details")); });
  expect(toggle).toHaveAttribute("aria-checked", "false");
  expect(screen.getByRole("alert")).toHaveTextContent("The previous value has been restored");
  expect(screen.queryByText("private failure details")).not.toBeInTheDocument();

  act(() => { replaceUser((user) => ({ ...user, sendOrganiserTicketEmails: true })); });
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(saveUser).toHaveBeenNthCalledWith(2, firstUser.userId, { sendOrganiserTicketEmails: true });
  await act(async () => { retried.reject(new Error("still unavailable")); });
  expect(toggle).toHaveAttribute("aria-checked", "true");

  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(await screen.findByText("Saved")).toBeInTheDocument();
  expect(saveUser).toHaveBeenNthCalledWith(3, firstUser.userId, { sendOrganiserTicketEmails: true });
});

it("never rolls back another account through the global user setter or retries the previous account", async () => {
  const pending = deferred();
  saveUser.mockReturnValue(pending.promise);
  render(<Harness />);
  fireEvent.click(screen.getByRole("switch"));
  act(() => { replaceUser({ ...firstUser, userId: "organiser-2" as UserId, sendOrganiserTicketEmails: true }); });

  await act(async () => { pending.reject(new Error("old account failure")); });
  expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  expect(screen.getByRole("switch")).toBeDisabled();
  expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
  expect(globalUserUpdates).toHaveBeenCalledTimes(1);
  expect(saveUser).toHaveBeenCalledTimes(1);
});

it.each(["replacement", "signout"])("blocks a stale click before the parent rerenders after auth %s", (change) => {
  render(<Harness />);
  const toggle = screen.getByRole("switch");
  authState.currentUser = change === "replacement" ? { uid: "organiser-2" } : null;

  fireEvent.click(toggle);

  expect(saveUser).not.toHaveBeenCalled();
  expect(globalUserUpdates).not.toHaveBeenCalled();
  expect(toggle).toHaveAttribute("aria-checked", "false");
  expect(toggle).toBeDisabled();
  expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
});

it.each(["replacement", "signout"])("blocks retained Retry before the parent rerenders after auth %s", async (change) => {
  saveUser.mockRejectedValue(new Error("save failed"));
  render(<Harness />);
  fireEvent.click(screen.getByRole("switch"));
  const retry = await screen.findByRole("button", { name: "Retry" });
  expect(globalUserUpdates).toHaveBeenCalledTimes(2);
  authState.currentUser = change === "replacement" ? { uid: "organiser-2" } : null;

  fireEvent.click(retry);

  expect(saveUser).toHaveBeenCalledTimes(1);
  expect(globalUserUpdates).toHaveBeenCalledTimes(2);
  expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
  expect(screen.getByRole("switch")).toBeDisabled();
  expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
});

it.each([
  ["replacement", "success"],
  ["replacement", "rejection"],
  ["signout", "success"],
  ["signout", "rejection"],
])("suppresses stale %s account feedback and rollback after deferred %s", async (change, outcome) => {
  const pending = deferred();
  saveUser.mockReturnValue(pending.promise);
  render(<Harness />);
  fireEvent.click(screen.getByRole("switch"));
  authState.currentUser = change === "replacement" ? { uid: "organiser-2" } : null;

  await act(async () => {
    if (outcome === "success") pending.resolve();
    else pending.reject(new Error("old account failure"));
  });

  expect(globalUserUpdates).toHaveBeenCalledTimes(1);
  expect(saveUser).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  expect(screen.getByRole("switch")).toBeDisabled();
  expect(screen.queryByText("Saved")).not.toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
});

it.each(["success", "rejection"])("keeps a same-account save owned during loading and reports its %s", async (outcome) => {
  const pending = deferred();
  saveUser.mockReturnValue(pending.promise);
  render(<Harness />);
  const toggle = screen.getByRole("switch");
  fireEvent.click(toggle);
  act(() => { setUserLoading(true); });
  fireEvent.click(toggle);
  expect(saveUser).toHaveBeenCalledTimes(1);
  expect(toggle).toBeDisabled();
  expect(screen.getByRole("status")).toHaveTextContent("Saving changes");

  await act(async () => {
    if (outcome === "success") pending.resolve();
    else pending.reject(new Error("save failed"));
  });

  expect(toggle).toHaveAttribute("aria-checked", String(outcome === "success"));
  expect(toggle).toBeDisabled();
  if (outcome === "success") {
    expect(screen.getByText("Saved")).toBeInTheDocument();
  } else {
    expect(screen.getByRole("alert")).toHaveTextContent("The previous value has been restored");
    const retry = screen.getByRole("button", { name: "Retry" });
    expect(retry).toBeDisabled();
    fireEvent.click(retry);
    expect(saveUser).toHaveBeenCalledTimes(1);
    act(() => { setUserLoading(false); });
    saveUser.mockResolvedValue(undefined);
    fireEvent.click(retry);
    expect(await screen.findByText("Saved")).toBeInTheDocument();
    expect(saveUser).toHaveBeenNthCalledWith(2, firstUser.userId, { sendOrganiserTicketEmails: true });
  }
});

it.each(["apply", "rollback"])("checks live account identity when a queued global %s updater executes", async (operation) => {
  const pending = deferred();
  const setUser = jest.fn<void, [SetStateAction<UserData>]>();
  saveUser.mockReturnValue(pending.promise);
  jest.mocked(useUser).mockReturnValue({ user: firstUser, setUser, userLoading: false, auth, refreshUser: jest.fn() });
  render(<SettingsPreferencesPanel />);
  fireEvent.click(screen.getByRole("switch"));
  if (operation === "rollback") {
    await act(async () => { pending.reject(new Error("save failed")); });
  }
  const update = setUser.mock.calls[operation === "apply" ? 0 : 1][0];
  if (typeof update !== "function") throw new Error("Expected a functional user update");
  const previous = { ...firstUser, sendOrganiserTicketEmails: operation === "rollback" };
  const otherAccount = { ...previous, userId: "organiser-2" as UserId };
  expect(update(otherAccount)).toBe(otherAccount);

  authState.currentUser = { uid: "organiser-2" };
  expect(update(previous)).toBe(previous);
  authState.currentUser = null;
  expect(update(previous)).toBe(previous);
  if (operation === "apply") await act(async () => { pending.resolve(); });
});

it("suppresses global rollback after the account panel leaves", async () => {
  const pending = deferred();
  const setUser = jest.fn();
  saveUser.mockReturnValue(pending.promise);
  jest.mocked(useUser).mockReturnValue({ user: firstUser, setUser, userLoading: false, auth, refreshUser: jest.fn() });
  const view = render(<SettingsPreferencesPanel />);
  fireEvent.click(screen.getByRole("switch"));
  expect(setUser).toHaveBeenCalledTimes(1);
  view.unmount();

  await act(async () => { pending.reject(new Error("late failure")); });
  expect(setUser).toHaveBeenCalledTimes(1);
});
