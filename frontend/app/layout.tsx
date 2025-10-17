import AccessibilitySkipNavigation from "@/components/accessibility/SkipNavigation";
import MobileNavbar from "@/components/mobile/MobileNavbar";
import Navbar from "@/components/navbar/Navbar";
import UserContext from "@/components/utility/UserContext";
import GrafanaFaro from "@/observability/GrafanaFaro";
import { Environment, getEnvironment } from "@/utilities/environment";
import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "react-loading-skeleton/dist/skeleton.css";
import "./globals.css";

const satoshi = localFont({
  src: [
    {
      path: "../public/fonts/satoshi/TTF/Satoshi-Variable.ttf",
      weight: "300 900",
      style: "normal",
    },
    {
      path: "../public/fonts/satoshi/TTF/Satoshi-VariableItalic.ttf",
      weight: "300 900",
      style: "italic",
    },
  ],
  variable: "--font-satoshi",
});
export const metadata: Metadata = {
  title: "SPORTSHUB | Find your next social sport session!",
  description:
    "SPORTSHUB is a modern, not for profit platform for you to find, book and host your next social sports session. We make it easy for players to search for and book their sport session of choice and for organisers to seamlessly host their next session, with integrated booking and management systems. Try it out free today!",
  appleWebApp: {
    title: "SPORTSHUB",
  },
  // Icon is done via icon0.svg and icon1.png. The svg has @media (prefers-color-scheme: dark) hence differentiating dark and light modes.
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Sitelinks Search Box for Google Hierarchical Display */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              url: "https://www.sportshub.net.au",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: "https://www.sportshub.net.au/dashboard?search={search_term_string}",
                },
                "query-input": "required name=search_term_string",
              },
              mainEntity: {
                "@type": "ItemList",
                name: "Main Site Sections",
                itemListElement: [
                  {
                    "@type": "SiteNavigationElement",
                    position: 1,
                    name: "Platform Overview",
                    description: "Learn about Australia's leading social sports platform",
                    url: "https://www.sportshub.net.au/landing",
                  },
                  {
                    "@type": "SiteNavigationElement",
                    position: 2,
                    name: "Login",
                    description: "Access your sports account",
                    url: "https://www.sportshub.net.au/login",
                  },
                  {
                    "@type": "SiteNavigationElement",
                    position: 3,
                    name: "Blogs",
                    description: "Sports tips, updates and community stories",
                    url: "https://www.sportshub.net.au/blogs",
                  },
                  {
                    "@type": "SiteNavigationElement",
                    position: 4,
                    name: "Documentation",
                    description: "Documentation and support guides",
                    url: "https://www.sportshub.net.au/docs",
                  },
                ],
              },
            }),
          }}
        />
      </head>
      <GrafanaFaro>
        <UserContext>
          <body className={`${satoshi.className}`}>
            <AccessibilitySkipNavigation />
            <div className="md:hidden">
              <MobileNavbar />
            </div>
            <div className="hidden md:block">
              <Navbar />
            </div>
            <main id="main-content" className="min-h-screen pt-[var(--navbar-height)]">
              {children}
            </main>
          </body>
        </UserContext>
      </GrafanaFaro>
      {/* Google Analytics only in production */}
      {getEnvironment() === Environment.PRODUCTION && <GoogleAnalytics gaId="G-MQB86E2KJM" />}
    </html>
  );
}
