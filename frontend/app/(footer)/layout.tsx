import Footer from "@/components/Footer";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "SPORTSHUB",
            url: "https://www.sportshub.net.au",
            logo: "https://www.sportshub.net.au/images/logo.png",
            sameAs: ["https://www.instagram.com/sportshub.net.au/", "https://www.linkedin.com/company/sportshub-au"],
          }),
        }}
      />

      <div className="pb-[var(--footer-height)]">{children}</div>

      <Footer />
    </>
  );
}
