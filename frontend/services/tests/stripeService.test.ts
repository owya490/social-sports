import { EmptyPrivateUserData, UserId } from "@/interfaces/UserTypes";
import { getFirebaseFunctionByName } from "../src/firebaseFunctionsService";
import { getPrivateUserById } from "../src/users/usersService";
import { getStripeAccId, getStripeStandardAccountLink, getStripeStandardAccountSetupLink } from "../src/stripe/stripeService";

jest.mock("../src/firebaseFunctionsService", () => ({
  FIREBASE_FUNCTIONS_CREATE_STRIPE_STANDARD_ACCOUNT: "create_stripe_standard_account",
  getFirebaseFunctionByName: jest.fn(),
}));

jest.mock("../src/users/usersService", () => ({ getPrivateUserById: jest.fn() }));
jest.mock("@/observability/logger", () => ({ Logger: jest.fn(() => ({ warn: jest.fn(), error: jest.fn() })) }));

const createAccount = Object.assign(jest.fn(), { stream: jest.fn() });
const getPrivateUser = jest.mocked(getPrivateUserById);
const returnUrl = "http://localhost:3000/organiser/v2/settings";
const refreshUrl = "http://localhost:3000/stripe/refreshAccountLink";

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(getFirebaseFunctionByName).mockReturnValue(createAccount);
});

describe("Stripe setup links", () => {
  it.each(["https://connect.stripe.com/setup/example", returnUrl])("preserves the valid destination %s for both entry points", async (destination) => {
    createAccount.mockResolvedValue({ data: JSON.stringify({ url: destination }) });

    await expect(getStripeStandardAccountSetupLink("organiser-1", returnUrl, refreshUrl)).resolves.toBe(destination);
    await expect(getStripeStandardAccountLink("organiser-1", returnUrl, refreshUrl)).resolves.toBe(destination);
    expect(createAccount).toHaveBeenCalledWith({ organiser: "organiser-1", returnUrl, refreshUrl });
  });

  it.each([
    "not json",
    "null",
    JSON.stringify({}),
    JSON.stringify({ url: 123 }),
    JSON.stringify({ url: "" }),
    JSON.stringify({ url: "/error" }),
    JSON.stringify({ url: "/organiser/v2/settings" }),
    JSON.stringify({ url: "javascript:alert(1)" }),
    JSON.stringify({ url: "https://stripe.com.example.org/setup" }),
    JSON.stringify({ url: "http://connect.stripe.com/setup" }),
    JSON.stringify({ url: `${returnUrl}?unexpected=true` }),
  ])("rejects a malformed or unexpected callable response %s", async (data) => {
    createAccount.mockResolvedValue({ data });

    await expect(getStripeStandardAccountSetupLink("organiser-1", returnUrl, refreshUrl)).rejects.toThrow();
    await expect(getStripeStandardAccountLink("organiser-1", returnUrl, refreshUrl)).resolves.toBe("/error");
  });

  it("propagates request failures while the legacy entry point retains its fallback", async () => {
    const error = new Error("callable unavailable");
    createAccount.mockRejectedValue(error);

    await expect(getStripeStandardAccountSetupLink("organiser-1", returnUrl, refreshUrl)).rejects.toBe(error);
    await expect(getStripeStandardAccountLink("organiser-1", returnUrl, refreshUrl)).resolves.toBe("/error");
  });
});

describe("getStripeAccId", () => {
  it("distinguishes an absent Stripe ID from an account read failure", async () => {
    getPrivateUser.mockResolvedValueOnce({ ...EmptyPrivateUserData, stripeAccount: null });
    await expect(getStripeAccId("organiser-1" as UserId)).resolves.toBe("");

    getPrivateUser.mockResolvedValueOnce({ ...EmptyPrivateUserData, stripeAccount: "acct_123" });
    await expect(getStripeAccId("organiser-1" as UserId)).resolves.toBe("acct_123");

    const error = new Error("read unavailable");
    getPrivateUser.mockRejectedValueOnce(error);
    await expect(getStripeAccId("organiser-1" as UserId)).rejects.toBe(error);
  });
});
