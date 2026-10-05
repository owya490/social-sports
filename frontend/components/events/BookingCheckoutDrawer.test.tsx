import { EMPTY_EVENT_TICKET_TYPE } from "@/interfaces/EventTicketTypeTypes";
import { PYNG_PAYMENT_PROVIDER, resolveSupportedPaymentProviders, STRIPE_PAYMENT_PROVIDER } from "@/interfaces/EventTypes";
import { EmptyPublicUserData } from "@/interfaces/UserTypes";
import { renderToStaticMarkup } from "react-dom/server";
import { BookingCheckoutActions, BookingCheckoutSummary, offersPaymentChoice } from "./BookingCheckoutDrawer";

jest.mock("next/image", () => ({
  __esModule: true,
  default: () => null,
}));

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

  it("keeps Stripe clickable when supported providers are missing or empty, and always disables Pyng", () => {
    for (const supportedPaymentProviders of [undefined, null, []]) {
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
      <BookingCheckoutActions onPay={() => {}} supportedPaymentProviders={[PYNG_PAYMENT_PROVIDER]} />
    );
    expect(markup).not.toContain("Pay with Card");
    expect(markup).toContain("Pay with Pyng - Coming Soon...");
    expect(markup).toContain('disabled=""');
  });

  it("labels the card action Book with Card when organiser approval is required", () => {
    const markup = renderToStaticMarkup(<BookingCheckoutActions onPay={() => {}} bookingApprovalEnabled />);

    expect(markup).toContain("Book with Card");
    expect(markup).not.toContain("Pay with Card");
  });
});

describe("resolveSupportedPaymentProviders", () => {
  it("defaults missing and empty lists to Stripe", () => {
    expect(resolveSupportedPaymentProviders(undefined)).toEqual([STRIPE_PAYMENT_PROVIDER]);
    expect(resolveSupportedPaymentProviders(null)).toEqual([STRIPE_PAYMENT_PROVIDER]);
    expect(resolveSupportedPaymentProviders([])).toEqual([STRIPE_PAYMENT_PROVIDER]);
  });

  it("keeps an explicit provider list", () => {
    expect(resolveSupportedPaymentProviders([STRIPE_PAYMENT_PROVIDER, PYNG_PAYMENT_PROVIDER])).toEqual([
      STRIPE_PAYMENT_PROVIDER,
      PYNG_PAYMENT_PROVIDER,
    ]);
  });
});
