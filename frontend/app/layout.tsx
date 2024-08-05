import MobileNavbar from "@/components/mobile/MobileNavbar";
import Navbar from "@/components/navbar/Navbar";
import UserContext from "@/components/utility/UserContext";
import GrafanaFaro from "@/observability/GrafanaFaro";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const aileron = localFont({
  src: [
    {
      path: "../public/fonts/Aileron-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/Aileron-Italic.otf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/fonts/Aileron-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/Aileron-BoldItalic.otf",
      weight: "700",
      style: "italic",
    },
  ],
});

// const inter = Inter({ subsets: ["latin"] }); old font, just replace aileron with inter to swap back

export const metadata: Metadata = {
  title: "SportsHub | Book your next social sports session",
  description:
    "SportsHub is a modern, not for profit platform for you to find, book and host your next social sports session. We make it easy for players to search for and book their sport session of choice and for organisers to seamlessly host their next session, with integrated booking and management systems. Try it out free today!",
  icons: {
    icon: [
      {
        media: "(prefers-color-scheme: light)",
        url: "favicons/favicon-32x32-black.png",
      },
      {
        media: "(prefers-color-scheme: dark)",
        url: "/favicons/favicon-32x32-white.png",
      },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <GrafanaFaro>
        <UserContext>
          <body className={`${aileron.className}`}>
            <div className="hidden md:block">
              <Navbar />
            </div>
            <div className="md:hidden">
              <MobileNavbar />
            </div>
            <div className="min-h-screen">{children}</div>
          </body>
        </UserContext>
      </GrafanaFaro>
    </html>
  );
}
