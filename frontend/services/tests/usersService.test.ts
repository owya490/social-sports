jest.mock("../src/firebase", () => ({
  db: {},
}));

jest.mock("@/observability/logger", () => ({
  Logger: jest.fn().mockImplementation(() => ({
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  })),
}));

jest.mock("firebase/firestore", () => ({
  Timestamp: class Timestamp {
    constructor(
      public seconds: number,
      public nanoseconds: number
    ) {}
  },
  collection: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn((_db: unknown, ...pathSegments: string[]) => pathSegments.join("/")),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  runTransaction: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(() => Promise.resolve()),
}));

import { updateDoc } from "firebase/firestore";
import { updateUser } from "../src/users/usersService";

describe("updateUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not write the private user document when only public fields are changed", async () => {
    await updateUser("user-1" as any, {
      profilePicture: "https://example.test/profile.jpg",
    });

    expect(updateDoc).toHaveBeenCalledTimes(1);
    expect(updateDoc).toHaveBeenCalledWith("Users/Active/Public/user-1", {
      profilePicture: "https://example.test/profile.jpg",
    });
  });

  it("does not write the public user document when only private fields are changed", async () => {
    await updateUser("user-1" as any, {
      sendOrganiserTicketEmails: true,
    });

    expect(updateDoc).toHaveBeenCalledTimes(1);
    expect(updateDoc).toHaveBeenCalledWith("Users/Active/Private/user-1", {
      sendOrganiserTicketEmails: true,
    });
  });

  it("writes both user documents when public and private fields are changed", async () => {
    await updateUser("user-1" as any, {
      profilePicture: "https://example.test/profile.jpg",
      sendOrganiserTicketEmails: true,
    });

    expect(updateDoc).toHaveBeenCalledTimes(2);
    expect(updateDoc).toHaveBeenNthCalledWith(1, "Users/Active/Public/user-1", {
      profilePicture: "https://example.test/profile.jpg",
    });
    expect(updateDoc).toHaveBeenNthCalledWith(2, "Users/Active/Private/user-1", {
      sendOrganiserTicketEmails: true,
    });
  });

  it("only calls transaction.update for non-empty public-only payloads", async () => {
    const transaction = { update: jest.fn() };

    await updateUser(
      "user-1" as any,
      {
        profilePicture: "https://example.test/profile.jpg",
      },
      transaction as any
    );

    expect(updateDoc).not.toHaveBeenCalled();
    expect(transaction.update).toHaveBeenCalledTimes(1);
    expect(transaction.update).toHaveBeenCalledWith("Users/Active/Public/user-1", {
      profilePicture: "https://example.test/profile.jpg",
    });
  });

  it("only calls transaction.update for non-empty private-only payloads", async () => {
    const transaction = { update: jest.fn() };

    await updateUser(
      "user-1" as any,
      {
        sendOrganiserTicketEmails: true,
      },
      transaction as any
    );

    expect(updateDoc).not.toHaveBeenCalled();
    expect(transaction.update).toHaveBeenCalledTimes(1);
    expect(transaction.update).toHaveBeenCalledWith("Users/Active/Private/user-1", {
      sendOrganiserTicketEmails: true,
    });
  });

  it("calls transaction.update for both documents when public and private payloads are non-empty", async () => {
    const transaction = { update: jest.fn() };

    await updateUser(
      "user-1" as any,
      {
        profilePicture: "https://example.test/profile.jpg",
        sendOrganiserTicketEmails: true,
      },
      transaction as any
    );

    expect(updateDoc).not.toHaveBeenCalled();
    expect(transaction.update).toHaveBeenCalledTimes(2);
    expect(transaction.update).toHaveBeenNthCalledWith(1, "Users/Active/Public/user-1", {
      profilePicture: "https://example.test/profile.jpg",
    });
    expect(transaction.update).toHaveBeenNthCalledWith(2, "Users/Active/Private/user-1", {
      sendOrganiserTicketEmails: true,
    });
  });
});
