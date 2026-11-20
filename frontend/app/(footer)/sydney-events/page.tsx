import SportsSeoLandingPage from "@/components/seo/SportsSeoLandingPage";
import { Metadata } from "next";

const pageUrl = "https://www.sportshub.net.au/sydney-events";
const title = "Sydney Sports Events | Find Social Sport Sessions in Sydney | SPORTSHUB";
const description =
  "Find Sydney sports events, social sport sessions and local clubs on SPORTSHUB. Browse upcoming events across badminton, volleyball, pickleball and more.";
const operaHouseImageUrl = "https://upload.wikimedia.org/wikipedia/commons/9/9c/Sydney_Opera_House_01.jpg";

const faqs = [
  {
    question: "Where can I find sports events in Sydney?",
    answer:
      "SPORTSHUB lists upcoming social sport sessions and club-hosted events across Sydney. Browse live events, check locations and book directly from the event page.",
  },
  {
    question: "Does SPORTSHUB only show Sydney events?",
    answer:
      "For now SPORTSHUB operates in Sydney, so this landing page shows all active public events instead of filtering by suburb or location.",
  },
  {
    question: "Can Sydney clubs list events on SPORTSHUB?",
    answer:
      "Yes. Local clubs, organisers and community groups can create events, accept bookings and manage attendees through SPORTSHUB.",
  },
];

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title,
    description,
    url: pageUrl,
    siteName: "SPORTSHUB",
    images: [
      {
        url: operaHouseImageUrl,
        width: 5144,
        height: 3429,
        alt: "Sydney Opera House seen from Harbour Bridge",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [operaHouseImageUrl],
  },
  keywords: [
    "Sydney events",
    "Sydney sports events",
    "sports events Sydney",
    "social sport Sydney",
    "Sydney clubs",
    "things to do Sydney sport",
    "badminton Sydney",
    "volleyball Sydney",
  ],
};

export default function SydneyEventsPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: title,
      description,
      url: pageUrl,
      about: ["Sydney sports events", "social sport", "sports clubs"],
      areaServed: {
        "@type": "City",
        name: "Sydney",
        addressCountry: "AU",
      },
      publisher: {
        "@type": "Organization",
        name: "SPORTSHUB",
        url: "https://www.sportshub.net.au",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SportsSeoLandingPage
        eyebrow="Sydney events"
        title="Find your next Sydney sports event"
        subtitle="A polished guide to social sport sessions, community games and club-hosted events across Sydney."
        primaryCtaLabel="See highlighted Sydney events"
        heroLabel="Featuring a Sydney Opera House photo sourced from Wikimedia Commons to anchor SPORTSHUB's Sydney events guide."
        introTitle="Built for people looking for sport in Sydney"
        introCopy="SPORTSHUB helps players discover local sports events and helps organisers reach the Sydney community. Browse upcoming sessions, compare clubs and jump into the event that fits your week."
        benefits={[
          "Live events from local organisers",
          "Badminton, volleyball and more",
          "Simple booking paths",
          "Sydney-first sports discovery",
        ]}
        faqs={faqs}
      />
    </>
  );
}
