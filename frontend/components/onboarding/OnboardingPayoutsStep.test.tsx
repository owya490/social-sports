import { EmptyUserData, UserId } from "@/interfaces/UserTypes";
import { getStripeStandardAccountLink } from "@/services/src/stripe/stripeService";
import { getRefreshAccountLinkUrl } from "@/services/src/stripe/stripeUtils";
import { getUrlWithCurrentHostname } from "@/services/src/urlUtils";
import { markProductOnboardingCompleted } from "@/services/src/users/usersService";
import { renderToStaticMarkup } from "react-dom/server";
import OnboardingPayoutsStep, {
  canContinuePayoutDetails,
  canFinishBankAccount,
  isValidAbn,
  ParsedAddress,
  PayoutDetailsFields,
  requestExistingStripeAccountLink,
  resolveAccountHolderName,
  validateBankAccount,
  validatePayoutDetails,
} from "./OnboardingPayoutsStep";

jest.mock("@/components/organiser/v2/event-hub/EventHubDescriptionEditor", () => ({
  EventHubDescriptionEditor: () => null,
}));

jest.mock("@/components/organiser/v2/settings/SportshubStripeIntegrationIcon", () => ({
  SportshubStripeIntegrationIcon: () => <div data-testid="stripe-icon" />,
}));

jest.mock("@/components/utility/UserContext", () => ({
  useUser: jest.fn(() => ({
    user: {
      ...EmptyUserData,
      userId: "user-123",
      firstName: "Ada",
      surname: "Lovelace",
      publicContactInformation: {
        email: "ada@example.com",
        mobile: "0412345678",
      },
      contactInformation: {
        email: "ada@example.com",
        mobile: "0412345678",
      },
    },
  })),
}));

jest.mock("@/services/src/maps/mapsService", () => ({
  initializeAutocomplete: jest.fn(),
  useGoogleMapsScript: jest.fn(() => ({ isLoaded: false })),
}));

jest.mock("@/services/src/stripe/stripeService", () => ({
  getStripeStandardAccountLink: jest.fn(),
  startStripePayoutOnboarding: jest.fn(),
}));

jest.mock("@/services/src/stripe/stripeUtils", () => ({
  getRefreshAccountLinkUrl: jest.fn(() => "https://www.sportshub.net.au/stripe/refreshAccountLink"),
}));

jest.mock("@/services/src/urlUtils", () => ({
  getUrlWithCurrentHostname: jest.fn((path: string) => `https://www.sportshub.net.au${path}`),
}));

jest.mock("@/services/src/users/usersService", () => ({
  markProductOnboardingCompleted: jest.fn(),
  updateUser: jest.fn(),
}));

const mockGetStripeStandardAccountLink = getStripeStandardAccountLink as jest.MockedFunction<
  typeof getStripeStandardAccountLink
>;
const mockGetRefreshAccountLinkUrl = getRefreshAccountLinkUrl as jest.MockedFunction<typeof getRefreshAccountLinkUrl>;
const mockGetUrlWithCurrentHostname = getUrlWithCurrentHostname as jest.MockedFunction<typeof getUrlWithCurrentHostname>;
const mockMarkProductOnboardingCompleted = markProductOnboardingCompleted as jest.MockedFunction<
  typeof markProductOnboardingCompleted
>;

const VALID_ADDRESS: ParsedAddress = {
  line1: "1 George St",
  city: "Sydney",
  state: "NSW",
  postcode: "2000",
};

const VALID_DETAILS: PayoutDetailsFields = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  hasAbn: false,
  abn: "",
  dateOfBirth: "1990-05-15",
  address: VALID_ADDRESS,
};

describe("OnboardingPayoutsStep forms", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders only personal/payout details and the existing Stripe button on the primary form with Continue", () => {
    const markup = renderToStaticMarkup(
      <OnboardingPayoutsStep onBack={() => {}} onFinished={async () => {}} />
    );

    expect(markup).toContain("Getting paid");
    expect(markup).toContain("Do you have an ABN?");
    expect(markup).toContain("I have an existing Stripe account");
    expect(markup).toContain('id="payout-first-name"');
    expect(markup).toContain('id="payout-last-name"');
    expect(markup).toContain('id="payout-email"');
    expect(markup).toContain('id="payout-dob"');
    expect(markup).toContain('id="payout-address"');
    expect(markup).toContain("Continue");
    expect(markup).toContain("Back");
    expect(markup).toContain("Skip");

    expect(markup).not.toContain('id="payout-account-name"');
    expect(markup).not.toContain('id="payout-bsb"');
    expect(markup).not.toContain('id="payout-account-number"');
    expect(markup).not.toContain(">Finish<");
  });

  it("renders only bank account fields on the secondary form with Finish", () => {
    const markup = renderToStaticMarkup(
      <OnboardingPayoutsStep onBack={() => {}} onFinished={async () => {}} initialSubStep="bank" />
    );

    expect(markup).toContain("Bank account");
    expect(markup).toContain('id="payout-account-name"');
    expect(markup).toContain('value="Ada Lovelace"');
    expect(markup).toContain('id="payout-bsb"');
    expect(markup).toContain('id="payout-account-number"');
    expect(markup).toContain("Finish");
    expect(markup).toContain("Back");
    expect(markup).toContain("Skip");

    expect(markup).not.toContain("Do you have an ABN?");
    expect(markup).not.toContain("I have an existing Stripe account");
    expect(markup).not.toContain('id="payout-first-name"');
    expect(markup).not.toContain('id="payout-dob"');
    expect(markup).not.toContain('id="payout-address"');
    expect(markup).not.toContain(">Continue<");
  });

  it("requests a standard Stripe onboarding link and marks onboarding completed before redirecting", async () => {
    mockGetStripeStandardAccountLink.mockResolvedValue("https://connect.stripe.com/setup/s/existing");
    mockMarkProductOnboardingCompleted.mockResolvedValue(undefined);

    const url = await requestExistingStripeAccountLink("user-123" as UserId);

    expect(mockGetUrlWithCurrentHostname).toHaveBeenCalledWith("/organiser/v2/settings");
    expect(mockGetRefreshAccountLinkUrl).toHaveBeenCalledTimes(1);
    expect(mockGetStripeStandardAccountLink).toHaveBeenCalledWith(
      "user-123",
      "https://www.sportshub.net.au/organiser/v2/settings",
      "https://www.sportshub.net.au/stripe/refreshAccountLink"
    );
    expect(mockMarkProductOnboardingCompleted).toHaveBeenCalledWith("user-123");
    expect(url).toBe("https://connect.stripe.com/setup/s/existing");
  });

  it("still returns the Stripe link if marking onboarding completed fails", async () => {
    mockGetStripeStandardAccountLink.mockResolvedValue("https://connect.stripe.com/setup/s/existing");
    mockMarkProductOnboardingCompleted.mockRejectedValue(new Error("Firestore unavailable"));

    const url = await requestExistingStripeAccountLink("user-123" as UserId);

    expect(mockMarkProductOnboardingCompleted).toHaveBeenCalledWith("user-123");
    expect(url).toBe("https://connect.stripe.com/setup/s/existing");
  });

  it("throws when Stripe link creation fails", async () => {
    mockGetStripeStandardAccountLink.mockResolvedValue("/error");

    await expect(requestExistingStripeAccountLink("user-123" as UserId)).rejects.toThrow(
      "Could not open Stripe. Try again."
    );
    expect(mockMarkProductOnboardingCompleted).not.toHaveBeenCalled();
  });
});

describe("OnboardingPayoutsStep validation", () => {
  it("validates details form progression independently of bank account fields", () => {
    expect(canContinuePayoutDetails(VALID_DETAILS)).toBe(true);
    expect(canContinuePayoutDetails({ ...VALID_DETAILS, firstName: "  " })).toBe(false);
    expect(canContinuePayoutDetails({ ...VALID_DETAILS, lastName: "" })).toBe(false);
    expect(canContinuePayoutDetails({ ...VALID_DETAILS, email: "invalid" })).toBe(false);
    expect(canContinuePayoutDetails({ ...VALID_DETAILS, dateOfBirth: "" })).toBe(false);
    expect(canContinuePayoutDetails({ ...VALID_DETAILS, address: null })).toBe(false);

    expect(isValidAbn("51 824 753 556")).toBe(true);
    expect(isValidAbn("12345678901")).toBe(false);
    expect(canContinuePayoutDetails({ ...VALID_DETAILS, hasAbn: true, abn: "123" })).toBe(false);
    expect(canContinuePayoutDetails({ ...VALID_DETAILS, hasAbn: true, abn: "51 824 753 556" })).toBe(true);
  });

  it("returns actionable messages for details errors", () => {
    expect(validatePayoutDetails(VALID_DETAILS)).toBe("");
    expect(validatePayoutDetails({ ...VALID_DETAILS, firstName: "" })).toBe("Enter your legal name.");
    expect(validatePayoutDetails({ ...VALID_DETAILS, email: "bad" })).toContain("valid email");
    expect(validatePayoutDetails({ ...VALID_DETAILS, hasAbn: true, abn: "111" })).toBe("Enter a valid 11-digit ABN.");
    expect(validatePayoutDetails({ ...VALID_DETAILS, dateOfBirth: "" })).toBe("Enter your date of birth.");
    expect(validatePayoutDetails({ ...VALID_DETAILS, address: null })).toBe(
      "Choose an Australian street address from the suggestions."
    );
  });

  it("validates bank account fields and account number bounds", () => {
    const validBank = { accountHolderName: "Ada Lovelace", bsb: "062-000", accountNumber: "12345678" };
    expect(canFinishBankAccount(VALID_DETAILS, validBank)).toBe(true);
    expect(validateBankAccount(validBank)).toBe("");

    expect(canFinishBankAccount({ ...VALID_DETAILS, address: null }, validBank)).toBe(false);
    expect(canFinishBankAccount(VALID_DETAILS, { ...validBank, accountHolderName: "  " })).toBe(false);
    expect(validateBankAccount({ ...validBank, accountHolderName: " " })).toBe("Enter the account name.");

    expect(canFinishBankAccount(VALID_DETAILS, { ...validBank, bsb: "06200" })).toBe(false);
    expect(validateBankAccount({ ...validBank, bsb: "06200" })).toBe("Enter a 6-digit BSB and your account number.");

    expect(canFinishBankAccount(VALID_DETAILS, { ...validBank, accountNumber: "1234" })).toBe(false);
    expect(validateBankAccount({ ...validBank, accountNumber: "1234" })).toBe(
      "Enter a 6-digit BSB and your account number."
    );

    expect(canFinishBankAccount(VALID_DETAILS, { ...validBank, accountNumber: "12345678901" })).toBe(false);
    expect(validateBankAccount({ ...validBank, accountNumber: "12345678901" })).toBe(
      "Enter a 6-digit BSB and your account number."
    );
  });

  it("syncs default account holder name until the user edits it", () => {
    expect(resolveAccountHolderName("Ada", false, "Ada", "Lovelace")).toBe("Ada Lovelace");
    expect(resolveAccountHolderName("Sports Club Pty Ltd", true, "Ada", "Lovelace")).toBe("Sports Club Pty Ltd");
    expect(resolveAccountHolderName("", true, "Ada", "Lovelace")).toBe("");
  });
});
