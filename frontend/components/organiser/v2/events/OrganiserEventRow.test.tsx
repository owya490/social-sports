import { RecurringTemplateRow } from "@/components/organiser/v2/recurring/RecurringTemplateRow";
import { EMPTY_EVENT_TICKET_TYPE } from "@/interfaces/EventTicketTypeTypes";
import { EmptyEventData, EventData, EventId } from "@/interfaces/EventTypes";
import { EMPTY_RECURRENCE_TEMPLATE } from "@/interfaces/RecurringEventTypes";
import { Timestamp } from "firebase/firestore";
import { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getEventHoverFlags } from "./EventHoverBody";
import { OrganiserEventRow } from "./OrganiserEventRow";

jest.mock("next/navigation", () => ({
  usePathname: () => "/organiser/v2/event/dashboard",
}));

jest.mock("@/components/organiser/v2/shared/EntityHoverPreview", () => ({
  ...jest.requireActual("@/components/organiser/v2/shared/EntityHoverPreview"),
  EntityHoverPreview: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

jest.mock("@/services/src/users/usersService", () => ({
  getPrivateUserById: jest.fn(),
}));

jest.mock("@/services/src/functions/functionsUtils", () => ({
  executeGlobalAppControllerFunction: jest.fn(),
}));

jest.mock("@/services/src/recurringEvents/recurringEventsUtils", () => ({
  findRecurrenceTemplateDoc: jest.fn(),
}));

const event: EventData = {
  ...EmptyEventData,
  eventId: "event-status-test" as EventId,
  name: "Friday social volleyball",
  price: 1500,
  capacity: 24,
  vacancy: 6,
  paymentsActive: true,
  eventTicketTypes: {},
};

describe("Organiser event row status", () => {
  it("shows all applicable operational states in the linked row", () => {
    const markup = renderToStaticMarkup(
      <OrganiserEventRow event={{ ...event, paused: true, isPrivate: true, paymentsActive: false }} />
    );

    expect(markup).toContain("Bookings paused");
    expect(markup).toContain("Private");
    expect(markup).toContain("Payments off");
    expect(markup).toContain('href="/organiser/v2/event/event-status-test"');
    expect(markup).toContain("18/24");
  });

  it("leaves ordinary rows without an empty status line", () => {
    const markup = renderToStaticMarkup(<OrganiserEventRow event={event} />);

    expect(markup).not.toContain("<ul");
  });

  it.each([
    [0, 1500, "Bookings off"],
    [1500, 0, "Payments off"],
  ])("uses ticket-type price %i instead of legacy price %i for the off label", (price, legacyPrice, label) => {
    const markup = renderToStaticMarkup(
      <OrganiserEventRow event={{
        ...event,
        price: legacyPrice,
        paymentsActive: false,
        eventTicketTypes: { general: { ...EMPTY_EVENT_TICKET_TYPE, price } },
      }} />
    );

    expect(markup).toContain(label);
    expect(markup).not.toContain(label === "Bookings off" ? "Payments off" : "Bookings off");
  });

  it("keeps secondary hover information without repeating row-visible states", () => {
    const flagged = { ...event, paused: true, isPrivate: true, paymentsActive: false, waitlistEnabled: false };
    const formId = "form-status-test" as EventData["formId"];

    expect(getEventHoverFlags(flagged)).toBe("");
    expect(getEventHoverFlags({
      ...flagged, waitlistEnabled: true, bookingApprovalEnabled: true, promotionalCodesEnabled: true, formId,
    })).toBe("Waitlist · Approval required · Promo codes · Form attached");
  });

  it.each([
    ["Active", true, false],
    ["Paused", false, false],
    ["Ended", true, true],
  ])("shows recurring privacy while retaining the %s generation state", (label, recurrenceEnabled, ended) => {
    const template = {
      ...EMPTY_RECURRENCE_TEMPLATE,
      eventData: { ...event, isActive: true, isPrivate: true },
      recurrenceData: {
        ...EMPTY_RECURRENCE_TEMPLATE.recurrenceData,
        recurrenceEnabled,
        allRecurrences: [Timestamp.fromMillis(ended ? 1 : 4102444800000)],
      },
    };
    const markup = renderToStaticMarkup(<RecurringTemplateRow template={template} />);

    expect(markup).toContain("Private");
    expect(markup).toContain(`${label} · Weekly`);
    expect(markup).not.toContain("Bookings paused");
  });
});
