import { PaymentProvider } from "@/interfaces/FulfilmentTypes";
import { EmptyPublicUserData } from "@/interfaces/UserTypes";
import { renderToStaticMarkup } from "react-dom/server";
import { BookingCheckoutActions, BookingCheckoutSummary, offersPaymentChoice } from "./BookingCheckoutDrawer";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: { src: string; alt: string }) => ({
    $$typeof: Symbol.for("react.element"),
    type: "img",
    key: null,
    ref: null,
    props: { src: props.src, alt: props.alt },
  }),
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
  it("lists the ticket, quantity, and both payment actions", () => {
    const markup = renderToStaticMarkup(
      <>
        <BookingCheckoutSummary
          eventName="Friday Social"
          organiser={{
            ...EmptyPublicUserData,
            userId: "user-1",
            firstName: "Brian",
            surname: "Yang",
            profilePicture: "/images/pyng-mark.png",
          }}
          eventDate="Fri Jan 01 2100"
          itemName="General Admission"
          quantity={2}
          unitPriceCents={1500}
        />
        <BookingCheckoutActions pendingProvider={null} onPay={() => {}} />
      </>
    );

    expect(markup).toContain("Friday Social");
    expect(markup).toContain("Brian Yang");
    expect(markup).toContain("rounded-full");
    expect(markup).toContain("Fri Jan 01 2100");
    expect(markup).toContain("General Admission");
    expect(markup).toContain("$15.00 each");
    expect(markup).toContain("Qty 2");
    expect(markup).toContain("$30.00");
    expect(markup).toContain("$30.00 AUD");
    expect(markup).toContain("Credit card");
    expect(markup).toContain("bg-foreground");
    expect(markup).toContain("text-background");
    expect(markup).toContain("Pay with PYNG");
    expect(markup).toContain("/images/pyng-mark.png");
    expect(markup).not.toContain("About PayTo");
    expect(markup).toContain("No Credit Card Fees with Pyng. Uses PayTo, save 50c every payment.");
    expect(markup).toContain("https://pyng.com.au/customer-referral?referralCode=6YNCMZ");
    expect(markup).toContain("Sign up");
  });

  it("shows the pending state on the selected payment button", () => {
    const markup = renderToStaticMarkup(
      <BookingCheckoutActions pendingProvider={PaymentProvider.PYNG} onPay={() => {}} />
    );

    expect(markup).toContain("Booking...");
    expect(markup).toContain("Credit card");
    expect(markup).not.toContain("Pay with PYNG");
  });
});
