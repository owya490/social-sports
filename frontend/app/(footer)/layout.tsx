import Footer from "@/components/Footer";

export const metadata = {
  title: "SPORTSHUB | Find your next social sport session!",
  description: "Sportshub helps you find and book local sports events.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}

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

      <Footer />
    </>
  );
}
