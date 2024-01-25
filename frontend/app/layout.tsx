import Footer from "@/components/Footer";
import MobileNavbar from "@/components/mobile/MobileNavbar";
import Navbar from "@/components/navbar/Navbar";
// import "@mantine/tiptap/styles.css";
import type { Metadata } from "next";
import { Inter, Roboto_Condensed } from "next/font/google";
import "./globals.css";
import UserContext from "@/components/utility/UserContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

const roboto_condensed = Roboto_Condensed({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto-condensed",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <UserContext>
        <body className={`${inter.className} ${roboto_condensed.variable}`}>
          <div className="hidden md:block">
            <Navbar />
          </div>
          <div className="md:hidden">
            <MobileNavbar />
          </div>
          {children}
          <Footer />
        </body>
      </UserContext>
    </html>
  );
}
