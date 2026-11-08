import type { Viewport } from "next";
import type { ReactNode } from "react";

// iOS Safari 26 ignores theme-color. viewport-fit=cover lets a fixed bottom
// swatch tint the URL bar; the page background stays white so the top does not.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return children;
}
