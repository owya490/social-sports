import type { Metadata, Viewport } from "next";
import Dashboard from "./dashboard";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.sportshub.net.au"),
  title: "SPORTSHUB | Find your next social sport session!",
  description:
    "Discover and book local sports events on SPORTSHUB. Find volleyball, badminton, pickleball and more recreational sports activities near you.",

  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],

  icons: {
    icon: [
      { url: "/images/BlackLogo-Invert.svg", type: "image/svg+xml" },
      { url: "/images/BlackLogo.svg", type: "image/svg+xml", media: "(prefers-color-scheme: light)" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "512x512" },
      { url: "/apple-touch-icon-dark.png", sizes: "512x512", media: "(prefers-color-scheme: light)" },
    ],
  },

  openGraph: {
    title: "SPORTSHUB | Find your next social sport session!",
    description:
      "Discover and book local sports events on SPORTSHUB. Find volleyball, badminton, pickleball and more recreational sports activities near you.",
    url: "https://www.sportshub.net.au",
    siteName: "SPORTSHUB",
    images: [
      {
        url: "https://www.sportshub.net.au/images/logo.png",
        width: 300,
        height: 243,
        alt: "SPORTSHUB Logo",
      },
    ],
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "SPORTSHUB | Find your next social sport session!",
    description:
      "Discover and book local sports events on SPORTSHUB. Find volleyball, badminton, pickleball and more recreational sports activities near you.",
    images: ["https://www.sportshub.net.au/images/logo.png"],
  },

  alternates: {
    canonical: "https://www.sportshub.net.au",
  },

  keywords: [
    "sportshub",
    "sports events",
    "volleyball",
    "badminton",
    "pickleball",
    "find sports near me",
    "book sports",
    "sports events sydney",
    "volleyball sydney",
    "badminton sydney",
    "pickleball sydney",
    "social sports",
    "social sports sydney",
  ],

  applicationName: "SPORTSHUB",
};

export default function Page() {
  return <Dashboard />;
}
