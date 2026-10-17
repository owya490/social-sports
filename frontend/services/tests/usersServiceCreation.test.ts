import { EmptyUserData, UserId } from "@/interfaces/UserTypes";
import { runTransaction, Transaction } from "firebase/firestore";
import { createUser, deleteUser } from "../src/users/usersService";
import { updateUsername } from "../src/users/usersUtils/usernameUtils";

jest.mock("firebase/firestore", () => ({
  ...jest.requireActual("firebase/firestore"),
  doc: jest.fn((_db, ...path: string[]) => path.join("/")),
  runTransaction: jest.fn(),
}));
jest.mock("../src/firebase", () => ({ db: {} }));
jest.mock("@/observability/logger", () => ({
  Logger: jest.fn(() => ({ info: jest.fn(), error: jest.fn(), warn: jest.fn() })),
}));

const userId = "alice-id" as UserId;
let documents: Map<string, Record<string, unknown>>;

beforeEach(() => {
  jest.clearAllMocks();
  documents = new Map();
  jest.mocked(runTransaction).mockImplementation(async (_db, update) => {
    const writes: { path: string; data: Record<string, unknown> | null; merge?: boolean }[] = [];
    const transaction = {
      get: (path: string) => Promise.resolve({
        exists: () => documents.has(path),
        data: () => documents.get(path),
      }),
      set: (path: string, data: Record<string, unknown>) => { writes.push({ path, data }); },
      update: (path: string, data: Record<string, unknown>) => { writes.push({ path, data, merge: true }); },
      delete: (path: string) => {
        if (path.startsWith("Usernames/") && !documents.has(path)) {
          throw new Error("Rules deny deleting an absent username mapping");
        }
        writes.push({ path, data: null });
      },
    } as unknown as Transaction;
    const result = await update(transaction);
    for (const { path, data, merge } of writes) {
      if (data === null) documents.delete(path);
      else documents.set(path, merge ? { ...documents.get(path), ...data } : data);
    }
    return result;
  });
});

it("creates social profile and username together, then preserves existing profile data on retry", async () => {
  const profile = { ...EmptyUserData, userId, firstName: "Alice" };
  await createUser(profile, userId);
  expect(documents.get("Usernames/alice")).toEqual({ userId });
  expect(documents.get(`Users/Active/Public/${userId}`)).toMatchObject({ userId, username: "alice" });
  expect(documents.get(`Users/Active/Private/${userId}`)).toMatchObject({ userId, onboardingCompletedAt: null });

  const publicData = documents.get(`Users/Active/Public/${userId}`)!;
  publicData.bio = "Updated bio";
  await createUser(profile, userId);
  expect(documents.get(`Users/Active/Public/${userId}`)).toBe(publicData);
  expect(publicData.bio).toBe("Updated bio");
});

it("uses a UID-based username after common names are taken", async () => {
  for (let suffix = 0; suffix < 100; suffix++) {
    documents.set(`Usernames/user${suffix || ""}`, { userId: "other-user" });
  }

  await createUser({ ...EmptyUserData, userId, firstName: "User" }, userId);
  expect(documents.get(`Users/Active/Public/${userId}`)).toMatchObject({ username: "user_alice-id" });
  expect(documents.get("Usernames/user_alice-id")).toEqual({ userId });
});

it("preserves another user's name and atomically renames and removes its own mapping", async () => {
  documents.set("Usernames/alice", { userId: "other-user" });
  await createUser({ ...EmptyUserData, userId, firstName: "Alice" }, userId);
  expect(documents.get(`Users/Active/Public/${userId}`)).toMatchObject({ username: "alice1" });
  expect(documents.get("Usernames/alice")).toEqual({ userId: "other-user" });

  await expect(updateUsername(userId, "newname")).resolves.toBe(true);
  expect(documents.has("Usernames/alice1")).toBe(false);
  expect(documents.get("Usernames/newname")).toEqual({ userId });
  expect(documents.get(`Users/Active/Public/${userId}`)).toMatchObject({ username: "newname" });

  await deleteUser(userId);
  expect(documents.has("Usernames/newname")).toBe(false);
  expect(documents.has(`Users/Active/Public/${userId}`)).toBe(false);
  expect(documents.has(`Users/Active/Private/${userId}`)).toBe(false);
  expect(documents.get("Usernames/alice")).toEqual({ userId: "other-user" });
});

it("renames a legacy profile without a mapping", async () => {
  documents.set(`Users/Active/Public/${userId}`, { username: "legacy", bio: "Preserve me" });
  await expect(updateUsername(userId, "newname")).resolves.toBe(true);
  expect(documents.get(`Users/Active/Public/${userId}`)).toMatchObject({ username: "newname", bio: "Preserve me" });
  expect(documents.get("Usernames/newname")).toEqual({ userId });
});

it("refuses to rename a profile whose old mapping belongs to another account", async () => {
  documents.set(`Users/Active/Public/${userId}`, { username: "legacy" });
  documents.set("Usernames/legacy", { userId: "other-user" });
  await expect(updateUsername(userId, "newname")).rejects.toThrow();
  expect(documents.get("Usernames/legacy")).toEqual({ userId: "other-user" });
  expect(documents.has("Usernames/newname")).toBe(false);
});
