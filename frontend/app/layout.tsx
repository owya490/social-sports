import MobileNavbar from "@/components/mobile/MobileNavbar";
import Navbar from "@/components/navbar/Navbar";
import UserContext from "@/components/utility/UserContext";
import GrafanaFaro from "@/observability/GrafanaFaro";
import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import ReactQueryProvider from "@/utilities/ReactQueryProvider";
import { Provider } from "react-redux";
import StoreProvider from "./storeProvider";
// import { store } from "@/services/redux/store";

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

export const inter = Inter({ subsets: ["latin"] });
const montserrat = Montserrat({ subsets: ["latin"] });

// const montserrat = localFont({
//   src: [
//     {
//       path:""
//     }
//   ]
// })

// const inter = Inter({ subsets: ["latin"] }); old font, just replace aileron with inter to swap back

export default function RootLayout({
  children,
  pageProps, // pageProps should contain dehydrated state for hydration
}: {
  children: React.ReactNode;
  pageProps: any; // Define the type according to your actual data
}) {
  return (
    <html lang="en">
      <GrafanaFaro>
        <StoreProvider>
          <ReactQueryProvider>
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
          </ReactQueryProvider>
        </StoreProvider>
      </GrafanaFaro>
    </html>
  );
}

export const metadata: Metadata = {
  title: "SPORTSHUB",
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
