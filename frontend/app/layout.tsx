import MobileNavbar from "@/components/mobile/MobileNavbar";
import Navbar from "@/components/navbar/Navbar";
import UserContext from "@/components/utility/UserContext";
import GrafanaFaro from "@/observability/GrafanaFaro";
import type { Metadata } from "next";
import { Inter, Roboto_Condensed } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SPORTSHUB | Book your next social sports session",
  description:
    "SPORTSHUB is a modern, not for profit platform for you to find, book and host your next social sports session. We make it easy for players to search for and book their sport session of choice and for organisers to seamlessly host their next session, with integrated booking and management systems. Try it out free today!",
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

const roboto_condensed = Roboto_Condensed({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto-condensed",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <GrafanaFaro>
        <UserContext>
          <body className={`${inter.className} ${roboto_condensed.variable}`}>
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
