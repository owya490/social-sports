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

function actionsMarkup(supportedPaymentProviders?: PaymentProvider[] | null, bookingApprovalEnabled?: boolean) {
  return renderToStaticMarkup(
    <BookingCheckoutActions
      onPay={() => {}}
      supportedPaymentProviders={supportedPaymentProviders}
      bookingApprovalEnabled={bookingApprovalEnabled}
    />
  );
}

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
  });

  it("follows supported providers, with the Pyng flag overriding that list", () => {
    expect(actionsMarkup([PaymentProvider.PYNG])).not.toContain("Pay with Card");
    expect(actionsMarkup([PaymentProvider.STRIPE, PaymentProvider.PYNG])).toContain("Pay with Pyng - Coming Soon...");

    pyngFlag.mockReturnValue(true);
    const enabled = actionsMarkup([PaymentProvider.STRIPE]);
    expect(enabled).toContain("Pay with PYNG");
    expect(enabled).not.toContain("Coming Soon");
    expect(actionsMarkup(undefined, true)).toContain("Book with Card");
  });
});
