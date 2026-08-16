import type { Viewport } from "next";

/**
 * Organiser v2 page canvas is Clubhouse Grey (`--color-surface` / #f7f7f7).
 * Match iOS Safari status-bar / toolbar chrome to that canvas so the notch
 * and bottom browser chrome look seamless with the hub.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f7f7",
  colorScheme: "light",
};

export default function OrganiserV2Layout({ children }: { children: React.ReactNode }) {
  return children;
}
