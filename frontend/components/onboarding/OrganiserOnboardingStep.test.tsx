import { renderToStaticMarkup } from "react-dom/server";
import OrganiserOnboardingStep, {
  canContinuePayoutDetails,
  canFinishBankAccount,
  isValidAbn,
  ParsedAddress,
  PayoutDetailsFields,
  resolveAccountHolderName,
  validateBankAccount,
  validatePayoutDetails,
} from "./OrganiserOnboardingStep";

jest.mock("@/components/utility/UserContext", () => ({
  useUser: () => ({
    user: {
      userId: "user-1",
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
  }),
}));

jest.mock("@/services/src/maps/mapsService", () => ({
  useGoogleMapsScript: () => ({ isLoaded: false }),
  initializeAutocomplete: jest.fn(),
}));

jest.mock("@/services/src/stripe/stripeService", () => ({
  startStripePayoutOnboarding: jest.fn(),
}));

jest.mock("@/services/src/users/usersService", () => ({
  markProductOnboardingCompleted: jest.fn(),
  updateUser: jest.fn(),
}));

jest.mock("@/components/organiser/v2/event-hub/EventHubDescriptionEditor", () => ({
  EventHubDescriptionEditor: () => null,
}));

jest.mock("@/components/organiser/v2/settings/SportshubStripeIntegrationIcon", () => ({
  SportshubStripeIntegrationIcon: () => <div data-testid="stripe-icon" />,
}));

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

describe("OrganiserOnboardingStep forms", () => {
  it("renders only personal/payout details on the primary form with Continue", () => {
    const markup = renderToStaticMarkup(
      <OrganiserOnboardingStep onBack={() => {}} onFinished={async () => {}} />
    );

    expect(markup).toContain("Getting paid");
    expect(markup).toContain("Do you have an ABN?");
    expect(markup).toContain('id="payout-first-name"');
    expect(markup).toContain('id="payout-last-name"');
    expect(markup).toContain('id="payout-email"');
    expect(markup).toContain('id="payout-dob"');
    expect(markup).toContain('id="payout-address"');
    expect(markup).toContain("Continue");
    expect(markup).toContain("Back");
    expect(markup).toContain("Skip");

    // Bank fields live on the secondary form so neither form scrolls.
    expect(markup).not.toContain('id="payout-account-name"');
    expect(markup).not.toContain('id="payout-bsb"');
    expect(markup).not.toContain('id="payout-account-number"');
    expect(markup).not.toContain(">Finish<");
  });

  it("renders only bank account fields on the secondary form with Finish", () => {
    const markup = renderToStaticMarkup(
      <OrganiserOnboardingStep onBack={() => {}} onFinished={async () => {}} initialSubStep="bank" />
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
    expect(markup).not.toContain('id="payout-first-name"');
    expect(markup).not.toContain('id="payout-dob"');
    expect(markup).not.toContain('id="payout-address"');
    expect(markup).not.toContain(">Continue<");
  });
});

describe("OrganiserOnboardingStep validation", () => {
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

  it("returns actionable messages for details errors including missing phone", () => {
    expect(validatePayoutDetails(VALID_DETAILS, "0412345678")).toBe("");
    expect(validatePayoutDetails({ ...VALID_DETAILS, firstName: "" }, "0412345678")).toBe("Enter your legal name.");
    expect(validatePayoutDetails({ ...VALID_DETAILS, email: "bad" }, "0412345678")).toContain("valid email");
    expect(validatePayoutDetails(VALID_DETAILS, "")).toContain("phone number");
    expect(validatePayoutDetails({ ...VALID_DETAILS, hasAbn: true, abn: "111" }, "0412345678")).toBe(
      "Enter a valid 11-digit ABN."
    );
    expect(validatePayoutDetails({ ...VALID_DETAILS, dateOfBirth: "" }, "0412345678")).toBe(
      "Enter your date of birth."
    );
    expect(validatePayoutDetails({ ...VALID_DETAILS, address: null }, "0412345678")).toBe(
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
