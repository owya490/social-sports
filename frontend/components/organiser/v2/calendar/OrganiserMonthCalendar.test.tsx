import { PopoverPanel } from "@headlessui/react";
import { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CalendarDayEvent } from "./calendarUtils";
import { OrganiserMonthCalendar } from "./OrganiserMonthCalendar";

let mockRenderPanelContent = false;

jest.mock("@headlessui/react", () => {
  const actual = jest.requireActual<typeof import("@headlessui/react")>("@headlessui/react");
  return {
    ...actual,
    PopoverPanel: (props: ComponentProps<typeof PopoverPanel>) => (
      <actual.PopoverPanel {...props} anchor={false} portal={false} static={mockRenderPanelContent} />
    ),
  };
});

describe("Organiser month calendar", () => {
  const month = new Date(2026, 9, 1);
  const events: CalendarDayEvent[] = Array.from({ length: 20 }, (_, index) => ({
    eventId: `session-${index}`,
    name: index === 3 ? "A very long community volleyball session name for all experience levels" : `Session ${index}`,
    start: new Date(2026, 9, 12, 8, index * 15),
    end: new Date(2026, 9, 12, 9, index * 15),
    color: "#2563eb",
    href: `/organiser/v2/event/session-${index}`,
  }));
  const navigation = { onPrevMonth: jest.fn(), onNextMonth: jest.fn(), onToday: jest.fn() };

  beforeEach(() => {
    mockRenderPanelContent = false;
  });

  it.each([0, 3, 4, 20])("shows at most three links and an accurate overflow count for %i sessions", (count) => {
    const markup = renderToStaticMarkup(
      <OrganiserMonthCalendar month={month} eventsByDay={new Map([["2026-10-12", events.slice(0, count)]])} {...navigation} />
    );

    expect(markup.match(/href="\/organiser\/v2\/event\/session-/g) ?? []).toHaveLength(Math.min(3, count));
    if (count > 3) {
      expect(markup).toContain(`+${count - 3} more`);
      expect(markup).toContain(`Show all ${count} sessions for Monday 12 October 2026`);
    } else {
      expect(markup).not.toContain("Show all");
    }
  });

  it("disables the overflow trigger during loading", () => {
    const markup = renderToStaticMarkup(
      <OrganiserMonthCalendar month={month} eventsByDay={new Map([["2026-10-12", events.slice(0, 4)]])} loading {...navigation} />
    );
    const trigger = markup.match(/<button[^>]*aria-label="Show all[^"]*"[^>]*>/)?.[0];

    expect(trigger).toContain('disabled=""');
    expect(markup).toContain('aria-busy="true"');
  });

  it("includes every session, visible start times, full names and event links in the day panel", () => {
    mockRenderPanelContent = true;
    const markup = renderToStaticMarkup(
      <OrganiserMonthCalendar month={month} eventsByDay={new Map([["2026-10-12", events.slice(0, 4)]])} {...navigation} />
    );

    expect([...markup.matchAll(/<time[^>]*>([^<]*)<\/time>/g)].map((match) => match[1])).toEqual([
      "8:00 AM", "8:15 AM", "8:30 AM", "8:45 AM",
    ]);
    expect(markup).toContain(events[3].name);
    expect(markup).toContain('href="/organiser/v2/event/session-3"');
    expect(markup).toContain('aria-label="Sessions for Monday 12 October 2026"');
    expect(markup).toContain('aria-label="Close sessions"');
  });
});
