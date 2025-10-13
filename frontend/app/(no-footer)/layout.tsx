import React from "react";
import Script from "next/script";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SPORTSHUB | Organizer Dashboard",
  description: "Manage your sports events, view participants, and organize tournaments with SPORTSHUB's organizer tools.",
  openGraph: {
    title: "SPORTSHUB | Organizer Dashboard",
    description: "Manage your sports events, view participants, and organize tournaments with SPORTSHUB's organizer tools.",
    type: "website",
    url: "https://sportshub.net.au",
    images: [
      {
        url: "https://sportshub.net.au/images/logo.png",
        width: 1200,
        height: 630,
        alt: "SPORTSHUB Logo"
      }
    ]
  },
  robots: {
    index: true,
    follow: true
  }
};

function toJsonLd(data: unknown) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}

      <Script id="organization-structured-data" type="application/ld+json" strategy="afterInteractive">
        {toJsonLd({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "SPORTSHUB",
          url: "https://www.sportshub.net.au",
          logo: "https://www.sportshub.net.au/images/logo.png",
          sameAs: ["https://www.instagram.com/sportshub.net.au/", "https://www.linkedin.com/company/sportshub-au"],
        })}
      </Script>
    </>
  );
}
