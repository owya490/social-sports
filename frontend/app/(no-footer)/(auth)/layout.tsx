import type { Viewport } from "next";
import type { ReactNode } from "react";

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: "@media (max-width: 767px) { html, body { background-color: #000; } }",
        }}
      />
      {children}
    </>
  );
}
