import { EventId } from "@/interfaces/EventTypes";
import { EmptyPublicUserData } from "@/interfaces/UserTypes";
import { Timestamp } from "firebase/firestore";
import { renderToStaticMarkup } from "react-dom/server";
import EventCard from "./EventCard";

jest.mock("@svgs/Verified_tick.png", () => "verified-tick.png");

const organiser = {
  ...EmptyPublicUserData,
  userId: "host-1",
  firstName: "Ada",
  surname: "Lovelace",
};

const cardProps = {
  image: "",
  thumbnail: "",
  name: "Friday Social",
  organiser,
  startTime: Timestamp.fromDate(new Date("2026-06-01T00:00:00Z")),
  location: "Sydney",
  price: 0,
  vacancy: 4,
  loading: false,
};

function anchorBlocks(markup: string) {
  return [...markup.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)].map((match) => match[0]);
}

describe("EventCard host link", () => {
  it("opens the host pill on the user page and the card on the event page", () => {
    const markup = renderToStaticMarkup(<EventCard {...cardProps} eventId={"event-1" as EventId} />);
    const anchors = anchorBlocks(markup);
    const eventLink = anchors.find((anchor) => anchor.includes('href="/event/event-1"'));
    const hostLink = anchors.find((anchor) => anchor.includes('href="/user/host-1"'));

    expect(eventLink).toContain("Friday Social");
    expect(eventLink).not.toContain("Hosted by Ada Lovelace");
    expect(hostLink).toContain("Hosted by Ada Lovelace");
    expect(hostLink).not.toContain('href="/event/event-1"');
  });

  it("keeps the host pill linked when the card itself is not clickable", () => {
    const markup = renderToStaticMarkup(<EventCard {...cardProps} isClickable={false} />);

    expect(markup).toContain('href="/user/host-1"');
    expect(markup).toContain("Hosted by Ada Lovelace");
    expect(markup).not.toContain('href="/event/');
  });
});
