import SportsSeoLandingPage from "@/components/seo/SportsSeoLandingPage";
import type { Metadata } from "next";

const pageUrl = "https://www.sportshub.net.au/badminton-sydney";
const title = "Badminton Sydney | Social Badminton Events and Clubs | SPORTSHUB";
const description =
  "Find badminton events in Sydney on SPORTSHUB. Browse social badminton sessions, local clubs and community sport events across Sydney.";

const faqs = [
  {
    question: "Where can I find social badminton in Sydney?",
    answer:
      "SPORTSHUB lists active public sports events from Sydney organisers. Badminton sessions appear here when clubs and organisers publish them on the platform.",
  },
  {
    question: "Can beginners join Sydney badminton events?",
    answer:
      "Many social badminton sessions are designed for mixed skill levels. Open an event page to review organiser details, session notes, pricing and booking requirements.",
  },
  {
    question: "Does SPORTSHUB only show badminton?",
    answer:
      "This landing page highlights badminton when available. Because SPORTSHUB currently operates in Sydney, it can also surface other Sydney sports events while badminton listings grow.",
  },
];

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: pageUrl,
  },
  keywords: [
    "badminton sydney",
    "social badminton sydney",
    "badminton clubs sydney",
    "badminton events sydney",
    "book badminton sydney",
    "SPORTSHUB badminton",
  ],
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
};

export default function BadmintonSydneyPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SportsActivityLocation",
      name: "Badminton Sydney on SPORTSHUB",
      url: pageUrl,
      sport: "Badminton",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Sydney",
        addressRegion: "NSW",
        addressCountry: "AU",
      },
      description,
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
        eyebrow="Badminton Sydney"
        title="Find badminton events in Sydney"
        subtitle="Browse social badminton sessions, local organisers and community sports events on SPORTSHUB."
        primaryCtaLabel="View badminton events"
        sportFilter="badminton"
        heroLabel="Sydney badminton landing page with live event listings from SPORTSHUB."
        introTitle="A cleaner way to discover Sydney badminton"
        introCopy="SPORTSHUB helps players find local badminton sessions without digging through group chats and scattered club pages. Explore events, compare session details and book through the organiser's event page."
        benefits={[
          "Social badminton sessions",
          "Sydney-based clubs and organisers",
          "Simple event booking pages",
          "Beginner-friendly discovery",
        ]}
        faqs={faqs}
      />
    </>
  );
}
