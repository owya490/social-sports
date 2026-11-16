import { EmptyEventData, EventData, EventId } from "@/interfaces/EventTypes";
import { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EventDuplicateMenu } from "./EventDuplicateMenu";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/organiser/v2/event/event-1",
}));

jest.mock("@/components/utility/UserContext", () => ({
  useUser: () => ({
    user: { userId: "user-1" },
    auth: { currentUser: { email: "organiser@example.com" } },
  }),
}));

jest.mock("@/services/src/events/eventsService", () => ({
  archiveAndDeleteEvent: jest.fn(),
  createEvent: jest.fn(),
}));

jest.mock("@/services/src/events/eventsUtils/getEventsUtils", () => ({
  bustEventsLocalStorageCache: jest.fn(),
}));

jest.mock("@/services/src/loops/loopsService", () => ({
  sendEmailOnDeleteEventV2: jest.fn(),
}));

jest.mock("@/services/src/organiser/organiserEventsService", () => ({
  bustOrganiserEventsCache: jest.fn(),
}));

// A closed Headless UI menu leaves its items out of static markup.
jest.mock("@headlessui/react", () => {
  const actual = jest.requireActual("@headlessui/react");
  return {
    ...actual,
    MenuItems: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    MenuItem: ({ children }: { children: ReactNode | ((args: { focus: boolean }) => ReactNode) }) => (
      <div>{typeof children === "function" ? children({ focus: false }) : children}</div>
    ),
  };
});

const event: EventData = {
  ...EmptyEventData,
  eventId: "event-1" as EventId,
  name: "Friday social",
};

describe("EventDuplicateMenu", () => {
  it("keeps delete beside duplicate in the event actions menu", () => {
    const markup = renderToStaticMarkup(<EventDuplicateMenu event={event} />);

    expect(markup).toContain('aria-label="Event actions"');
    expect(markup).toContain("Duplicate event");
    expect(markup).toContain("Delete event");
    expect(markup.indexOf("Duplicate event")).toBeLessThan(markup.indexOf(">Delete event<"));
  });
});
