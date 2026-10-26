import { renderToStaticMarkup } from "react-dom/server";
import PyngCompletePage from "@/app/(footer)/fulfilment/pyng-complete/page";
import {
  PYNG_POLL_INTERVAL_MS,
  PyngCheckoutWaiting,
  openPyngCheckoutOnce,
  pyngPollOutcome,
  pyngSuccessPagePath,
} from "./PyngFulfilmentEntity";
import { PyngDetailsCheckout, canSubmitPyngDetails } from "./PyngDetailsCheckout";

jest.mock("@/services/src/fulfilment/fulfilmentServices", () => ({
  refreshPyngCheckout: jest.fn(),
  updateFulfilmentPurchaser: jest.fn(),
}));

jest.mock("@/services/src/events/eventsService", () => ({
  getEventById: jest.fn(),
}));

jest.mock("@/components/loading/Loading", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/components/fulfilment/FulfilmentEntityPage", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("@/observability/logger", () => ({
  Logger: class {
    debug() {}
    info() {}
    warn() {}
    error() {}
  },
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe("Pyng details checkout", () => {
  it("requires a name and email before Pay with PYNG", () => {
    expect(canSubmitPyngDetails(" ", "ada@example.com")).toBe(false);
    expect(canSubmitPyngDetails("Ada", "not-an-email")).toBe(false);
    expect(canSubmitPyngDetails("Ada Lovelace", "ada@example.com")).toBe(true);

    const blocked = renderToStaticMarkup(
      <PyngDetailsCheckout
        eventName="Friday Social"
        eventImage={null}
        ticketName="General Admission"
        quantity={2}
        unitPriceCents={1500}
        name=""
        email=""
        emailError=""
        saving={false}
        saveError=""
        onNameChange={() => {}}
        onEmailChange={() => {}}
        onSubmit={() => {}}
      />
    );
    expect(blocked).toContain("Order summary");
    expect(blocked).toContain("Friday Social");
    expect(blocked).toContain("General Admission");
    expect(blocked).toContain("$30.00 AUD");
    expect(blocked).toContain("Pay with PYNG");
    expect(blocked).toContain('disabled=""');

    const ready = renderToStaticMarkup(
      <PyngDetailsCheckout
        eventName="Friday Social"
        eventImage={null}
        ticketName="General Admission"
        quantity={2}
        unitPriceCents={1500}
        name="Ada Lovelace"
        email="ada@example.com"
        emailError=""
        saving={false}
        saveError=""
        onNameChange={() => {}}
        onEmailChange={() => {}}
        onSubmit={() => {}}
      />
    );
    expect(ready).not.toContain('disabled=""');
  });
});

describe("Pyng fulfilment page", () => {
  it("stays open and points at the hosted checkout", () => {
    const markup = renderToStaticMarkup(
      <PyngCheckoutWaiting
        checkoutUrl="https://sample.pyng.com.au/launch/opaque"
        failed={false}
        refreshing={false}
        error=""
        onRefresh={() => {}}
      />
    );
    expect(markup).toContain("Pyng checkout will open in a new tab");
    expect(markup).toContain("Please keep this one open");
    expect(markup).toContain('href="https://sample.pyng.com.au/launch/opaque"');
    expect(markup).toContain("click here");
    expect(markup).toContain("Refresh");
  });

  it("does not offer the hosted checkout after payment fails", () => {
    const markup = renderToStaticMarkup(
      <PyngCheckoutWaiting checkoutUrl="https://sample.pyng.com.au/launch/opaque" failed refreshing={false} error="" onRefresh={() => {}} />
    );
    expect(markup).toContain("This payment did not complete");
    expect(markup).not.toContain("click here");
    expect(markup).not.toContain("sample.pyng.com.au");
  });

  it("opens the hosted checkout once", () => {
    const opened: string[] = [];
    const open = (url: string) => opened.push(url);
    expect(openPyngCheckoutOnce("https://sample.pyng.com.au/launch/opaque", false, open)).toBe(true);
    expect(openPyngCheckoutOnce("https://sample.pyng.com.au/launch/opaque", true, open)).toBe(true);
    expect(opened).toEqual(["https://sample.pyng.com.au/launch/opaque"]);
  });

  it("polls every minute and only advances when payment succeeds", () => {
    expect(PYNG_POLL_INTERVAL_MS).toBe(60_000);
    expect(pyngPollOutcome("PENDING")).toBe("pending");
    expect(pyngPollOutcome("SUCCEEDED")).toBe("succeeded");
    expect(pyngPollOutcome("EXPIRED")).toBe("failed");
    expect(pyngPollOutcome("CANCELLED")).toBe("failed");
    expect(pyngSuccessPagePath("event-1")).toBe("/event/success/event-1");
    expect(pyngSuccessPagePath(null)).toBeNull();
  });
});

describe("Pyng finished tab", () => {
  it("tells the buyer to return to the original tab", () => {
    const markup = renderToStaticMarkup(<PyngCompletePage />);
    expect(markup).toContain("Go back to the original tab");
    expect(markup).toContain("You can close this page");
  });
});
