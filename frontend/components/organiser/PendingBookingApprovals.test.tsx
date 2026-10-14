import { EventId } from "@/interfaces/EventTypes";
import { renderToStaticMarkup } from "react-dom/server";
import {
  PendingBookingApprovalsNotice,
  pendingBookingLabel,
} from "./PendingBookingApprovals";

describe("PendingBookingApprovalsNotice", () => {
  it("hides itself when nothing is waiting", () => {
    expect(renderToStaticMarkup(<PendingBookingApprovalsNotice approvals={[]} />)).toBe("");
  });

  it("links each event that still needs a booking accepted", () => {
    const html = renderToStaticMarkup(
      <PendingBookingApprovalsNotice
        approvals={[
          {
            eventId: "friday-social" as EventId,
            eventName: "Friday social",
            pendingOrderCount: 2,
          },
          {
            eventId: "sunday-hit" as EventId,
            eventName: "Sunday hit",
            pendingOrderCount: 1,
          },
        ]}
      />
    );

    expect(html).toContain("Needs approval");
    expect(html).toContain("Friday social");
    expect(html).toContain("Sunday hit");
    expect(html).toContain('href="/organiser/v2/event/friday-social"');
    expect(html).toContain(pendingBookingLabel(2));
    expect(html).toContain(pendingBookingLabel(1));
  });
});
