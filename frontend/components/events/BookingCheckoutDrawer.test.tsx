import { EMPTY_EVENT_TICKET_TYPE } from "@/interfaces/EventTicketTypeTypes";
import { PaymentProvider } from "@/interfaces/EventTypes";
import { EmptyPublicUserData } from "@/interfaces/UserTypes";
import { isPayWithPyngEnabled } from "@/services/featureFlags";
import { renderToStaticMarkup } from "react-dom/server";
import { BookingCheckoutActions, BookingCheckoutSummary, offersPaymentChoice } from "./BookingCheckoutDrawer";

jest.mock("next/image", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/services/featureFlags", () => ({
  isPayWithPyngEnabled: jest.fn(() => false),
}));

const pyngFlag = isPayWithPyngEnabled as jest.MockedFunction<typeof isPayWithPyngEnabled>;

describe("offersPaymentChoice", () => {
  it("skips the checkout drawer for free events", () => {
    expect(offersPaymentChoice(0)).toBe(false);
    expect(offersPaymentChoice(undefined)).toBe(false);
  });

  it("opens the checkout drawer for a paid ticket", () => {
    expect(offersPaymentChoice(1500)).toBe(true);
  });
});

describe("BookingCheckoutSummary", () => {
  beforeEach(() => {
    pyngFlag.mockReturnValue(false);
  });

  it("lists the ticket and both payment actions", () => {
    const markup = renderToStaticMarkup(
      <>
        <BookingCheckoutSummary
          eventName="Friday Social"
          organiser={{ ...EmptyPublicUserData, firstName: "Brian", surname: "Yang" }}
          eventDate="Fri Jan 01 2100"
          eventTicketType={{ ...EMPTY_EVENT_TICKET_TYPE, name: "General Admission", price: 1500 }}
          quantity={2}
        />
        <BookingCheckoutActions onPay={() => {}} />
      </>
    );

    expect(markup).toContain("Friday Social");
    expect(markup).toContain("Brian Yang");
    expect(markup).toContain("Fri Jan 01 2100");
    expect(markup).toContain("General Admission");
    expect(markup).toContain("$15.00");
    expect(markup).toContain("Pay with Card");
    expect(markup).toContain("Pay with Pyng - Coming Soon...");
    expect(markup).toContain('disabled=""');
    expect(markup.match(/disabled=""/g)).toHaveLength(1);
  });

  it("uses the EmptyEventData Stripe default when supported providers are missing", () => {
    for (const supportedPaymentProviders of [undefined, null]) {
      const markup = renderToStaticMarkup(
        <BookingCheckoutActions onPay={() => {}} supportedPaymentProviders={supportedPaymentProviders} />
      );
      expect(markup).toContain("Pay with Card");
      expect(markup).toContain("Pay with Pyng - Coming Soon...");
      expect(markup.match(/disabled=""/g)).toHaveLength(1);
    }
  });

  it("hides Stripe when the event does not support it", () => {
    const markup = renderToStaticMarkup(
      <BookingCheckoutActions onPay={() => {}} supportedPaymentProviders={[PaymentProvider.PYNG]} />
    );
    expect(markup).not.toContain("Pay with Card");
    expect(markup).toContain("Pay with Pyng - Coming Soon...");
    expect(markup).toContain('disabled=""');
  });

  it("keeps Pyng disabled when the flag is off, even if the event lists Pyng", () => {
    const markup = renderToStaticMarkup(
      <BookingCheckoutActions
        onPay={() => {}}
        supportedPaymentProviders={[PaymentProvider.STRIPE, PaymentProvider.PYNG]}
      />
    );
    expect(markup).toContain("Pay with Card");
    expect(markup).toContain("Pay with Pyng - Coming Soon...");
    expect(markup).toContain('disabled=""');
  });

  it("enables Pyng from the feature flag even when the event does not list Pyng", () => {
    pyngFlag.mockReturnValue(true);
    const markup = renderToStaticMarkup(
      <BookingCheckoutActions onPay={() => {}} supportedPaymentProviders={[PaymentProvider.STRIPE]} />
    );
    expect(markup).toContain("Pay with Card");
    expect(markup).toContain("Pay with PYNG");
    expect(markup).not.toContain("Coming Soon");
    expect(markup).not.toContain('disabled=""');
  });

  it("labels the card action Book with Card when organiser approval is required", () => {
    const markup = renderToStaticMarkup(<BookingCheckoutActions onPay={() => {}} bookingApprovalEnabled />);

    expect(markup).toContain("Book with Card");
    expect(markup).not.toContain("Pay with Card");
  });
});
