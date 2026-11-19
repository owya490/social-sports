import Image from "@/components/elements/AppImage";
import createScreen from "@/public/images/mocks/event-create-mock-current.webp";
import dashboardScreen from "@/public/images/mocks/dashboard-mock.webp";
import registrationsScreen from "@/public/images/mocks/registrations-mock.webp";
import { CheckIcon } from "@heroicons/react/20/solid";
import { StaticImageData } from "next/image";
import { CSSProperties } from "react";
import scroll from "./landingScroll.module.css";

type Stage = {
  id: string;
  phase: string;
  title: string;
  body: string;
  features: string[];
  screen: StaticImageData;
  screenAlt: string;
  /** Matches the screenshot's own page colour, so a short screen reads as the page continuing. */
  screenBg: "bg-white" | "bg-[#f7f7f7]";
  caption: string;
  /** Court marking drawn faintly behind the screen: a centre circle shifted across the three panels. */
  marks: string[];
};

const STAGES: Stage[] = [
  {
    id: "before",
    phase: "Before the session",
    title: "Post it in minutes",
    body: "Set the time, place, price and capacity, then share one link.",
    features: [
      "Card payments, with fees players can cover",
      "Booking forms and waivers",
      "Waitlists and booking approval",
      "Promo codes and private events",
      "Custom links and collections",
    ],
    screen: createScreen,
    screenAlt: "SPORTSHUB create event page",
    screenBg: "bg-white",
    caption: "Sample event",
    marks: ["M110 20 A150 150 0 1 0 110 320 A150 150 0 1 0 110 20", "M110 -10 V310"],
  },
  {
    id: "on-the-day",
    phase: "On the day",
    title: "Know who's coming",
    body: "Every booking lands in your registrations, ready for the door.",
    features: [
      "QR tickets and confirmations",
      "Automatic email reminders",
      "Add walk-ins by hand",
      "Copy emails or export a CSV",
    ],
    screen: registrationsScreen,
    screenAlt: "SPORTSHUB event registrations list",
    screenBg: "bg-[#f7f7f7]",
    caption: "Sample attendees",
    marks: ["M200 10 A150 150 0 1 0 200 310 A150 150 0 1 0 200 10", "M200 -10 V310"],
  },
  {
    id: "after",
    phase: "After",
    title: "Get paid, then go again",
    body: "Payouts go to your bank, and next week's session is already set up.",
    features: [
      "Stripe payouts to your bank",
      "Sales, tickets and page views",
      "Weekly or fortnightly recurring sessions",
      "Listed where players search",
    ],
    screen: dashboardScreen,
    screenAlt: "SPORTSHUB organiser dashboard",
    screenBg: "bg-[#f7f7f7]",
    caption: "Sample figures",
    marks: ["M290 20 A150 150 0 1 0 290 320 A150 150 0 1 0 290 20", "M290 -10 V310"],
  },
];

/** Everything an organiser gets, in one view: three stages of a session, each with a real screen. */
export default function SessionStory() {
  return (
    <section aria-labelledby="story-title" className="w-full bg-white py-24 md:py-32">
      <div className="mx-auto max-w-[1200px] px-6">
        <h2
          id="story-title"
          className={`max-w-3xl text-balance text-4xl font-bold leading-[1.05] tracking-[-0.03em] text-core-text md:text-6xl ${scroll.rise}`}
        >
          SPORTSHUB runs your session before, during and after.
        </h2>
        <p className={`mt-5 max-w-2xl text-pretty text-lg font-light text-gray-600 ${scroll.rise}`}>
          All of it included, with no subscription and no add-ons.
        </p>

        <ol className="mt-14 grid gap-14 md:grid-cols-3 md:gap-6 lg:gap-8">
          {STAGES.map((stage, index) => (
            <li key={stage.id} className={scroll.riseStagger} style={{ "--i": index } as CSSProperties}>
              <figure className="relative aspect-[4/3] overflow-clip rounded-3xl bg-[#f6f4ef] ring-1 ring-inset ring-[#e6e2d8]">
                <svg
                  aria-hidden
                  viewBox="0 0 400 300"
                  preserveAspectRatio="xMidYMid slice"
                  className="absolute inset-0 h-full w-full"
                  fill="none"
                  stroke="#f2b705"
                  strokeOpacity="0.55"
                  strokeWidth="3"
                  strokeLinecap="round"
                >
                  {stage.marks.map((d) => (
                    <path key={d} d={d} pathLength={1} className={scroll.drawLine} />
                  ))}
                </svg>
                <div
                  className={`absolute inset-x-[11%] bottom-0 top-[14%] overflow-hidden rounded-t-xl ${stage.screenBg} shadow-[0_2px_6px_rgba(10,10,10,0.10),0_24px_48px_-24px_rgba(10,10,10,0.45)]`}
                >
                  <Image src={stage.screen} alt={stage.screenAlt} sizes="(min-width: 1024px) 360px, (min-width: 768px) 30vw, 90vw" />
                </div>
                <figcaption className="absolute bottom-3 right-3 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-gray-600 shadow-sm ring-1 ring-black/10">
                  {stage.caption}
                </figcaption>
              </figure>

              <p className="mt-6 text-sm font-medium text-gray-500">{stage.phase}</p>
              <h3 className="mt-1 text-2xl font-bold tracking-[-0.02em] text-core-text">{stage.title}</h3>
              <p className="mt-2 text-pretty font-light leading-relaxed text-gray-600">{stage.body}</p>
              <ul className="mt-5 space-y-2.5">
                {stage.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <CheckIcon aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-core-text" />
                    {feature}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
