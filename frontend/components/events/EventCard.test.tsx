import { EventId } from "@/interfaces/EventTypes";
import { EmptyPublicUserData } from "@/interfaces/UserTypes";
import { Timestamp } from "firebase/firestore";
import { renderToStaticMarkup } from "react-dom/server";
import EventCard from "./EventCard";

jest.mock("@svgs/Verified_tick.png", () => "verified-tick.png");

const cardProps = {
  image: "",
  thumbnail: "",
  name: "Friday Social",
  organiser: { ...EmptyPublicUserData, userId: "host-1", firstName: "Ada", surname: "Lovelace" },
  startTime: Timestamp.fromDate(new Date("2026-06-01T00:00:00Z")),
  location: "Sydney",
  price: 0,
  vacancy: 4,
  loading: false,
};

describe("EventCard host link", () => {
  it("links the title to the event and the host pill to the user page", () => {
    const markup = renderToStaticMarkup(<EventCard {...cardProps} eventId={"event-1" as EventId} />);

    expect(markup).toMatch(/<a [^>]*href="\/event\/event-1"[^>]*>Friday Social<\/a>/);
    expect(markup).toMatch(/<a [^>]*href="\/user\/host-1"[^>]*>Hosted by Ada Lovelace<\/a>/);
  });

  it("keeps the host pill linked when the card itself is not clickable", () => {
    const markup = renderToStaticMarkup(<EventCard {...cardProps} isClickable={false} />);

    expect(markup).toContain('href="/user/host-1"');
    expect(markup).not.toContain('href="/event/');
  });
});
