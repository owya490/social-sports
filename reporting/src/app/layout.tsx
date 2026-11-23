import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SPORTSHUB Internal",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-100 text-neutral-950 antialiased">{children}</body>
    </html>
  );
}
