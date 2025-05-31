import MobileNavbar from "@/components/mobile/MobileNavbar";
import Navbar from "@/components/navbar/Navbar";
import UserContext from "@/components/utility/UserContext";
import GrafanaFaro from "@/observability/GrafanaFaro";
import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

/* eslint-disable */
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
/* eslint-enable */

export const inter = Inter({ subsets: ["latin"] });

// eslint-disable-next-line
const montserrat = Montserrat({ subsets: ["latin"] });

// const montserrat = localFont({
//   src: [
//     {
//       path:""
//     }
//   ]
// })

// const inter = Inter({ subsets: ["latin"] }); old font, just replace aileron with inter to swap back

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script async src="https://js.stripe.com/v3/buy-button.js"></script>
      </head>
      <GrafanaFaro>
        <UserContext>
          <body className={`${inter.className}`}>
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

export const metadata: Metadata = {
  title: "SPORTSHUB",
  description:
    "SportsHub is a modern, not for profit platform for you to find, book and host your next social sports session. We make it easy for players to search for and book their sport session of choice and for organisers to seamlessly host their next session, with integrated booking and management systems. Try it out free today!",
  icons: {
    icon: [
      {
        media: "(prefers-color-scheme: light)",
        url: "/images/icon-light.png",
        href: "/images/icon-light.png",
      },
      {
        media: "(prefers-color-scheme: dark)",
        url: "/images/icon-dark.png",
        href: "/images/icon-dark.png",
      },
    ],
  },
};
