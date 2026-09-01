import type { Viewport } from "next";

/**
 * Organiser Hub only — translucent mobile browser chrome (notch + URL bar).
 * Safari samples html/body background (set in OrganiserShell) behind the glass UI.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "rgba(247, 247, 247, 0)" },
    { media: "(prefers-color-scheme: dark)", color: "rgba(0, 0, 0, 0)" },
  ],
};

export default function OrganiserV2Layout({ children }: { children: React.ReactNode }) {
  return children;
}
