import SportsSeoLandingPage from "@/components/seo/SportsSeoLandingPage";
import type { Metadata } from "next";

const pageUrl = "https://www.sportshub.net.au/volleyball-sydney";
const title = "Volleyball Sydney | Social Volleyball Events & Clubs | SPORTSHUB";
const description =
  "Find volleyball events in Sydney with SPORTSHUB. Discover social volleyball games, clubs, training sessions and community competitions across Sydney.";

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
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  keywords: [
    "volleyball Sydney",
    "Sydney volleyball events",
    "social volleyball Sydney",
    "volleyball clubs Sydney",
    "beach volleyball Sydney",
    "indoor volleyball Sydney",
    "sports events Sydney",
    "SPORTSHUB",
  ],
};

const faqs = [
  {
    question: "Where can I find volleyball events in Sydney?",
    answer:
      "SPORTSHUB lists volleyball sessions from Sydney organisers, including social games, club events, training sessions and competitions where available.",
  },
  {
    question: "Are these volleyball events beginner friendly?",
    answer:
      "Many Sydney volleyball organisers host social sessions for mixed skill levels. Open the event page to check the description, organiser details and booking notes.",
  },
  {
    question: "Can volleyball clubs in Sydney list events on SPORTSHUB?",
    answer:
      "Yes. Sydney volleyball clubs and organisers can create SPORTSHUB events to manage bookings, payments, attendees and event promotion.",
  },
];

export default function VolleyballSydneyPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      description,
      url: pageUrl,
      about: {
        "@type": "SportsActivityLocation",
        name: "Volleyball in Sydney",
        sport: "Volleyball",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Sydney",
          addressRegion: "NSW",
          addressCountry: "AU",
        },
      },
      provider: {
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />
      <SportsSeoLandingPage
        eyebrow="Volleyball Sydney"
        title="Find volleyball events in Sydney."
        subtitle="A minimalist SPORTSHUB guide to Sydney volleyball games, clubs, training sessions and community competitions."
        primaryCtaLabel="View volleyball events"
        sportFilter="volleyball"
        heroLabel="Sydney volleyball landing page featuring Opera House inspired black-and-white artwork."
        introTitle="Social volleyball in Sydney, listed in one place."
        introCopy="Use SPORTSHUB to discover Sydney volleyball events hosted by local clubs, social organisers and community groups. Event listings can include session details, booking options, organiser profiles and venue information."
        benefits={[
          "Indoor and outdoor volleyball sessions",
          "Social games and club events",
          "Sydney-based organisers",
          "Simple online booking",
        ]}
        faqs={faqs}
      />
    </>
  );
}
