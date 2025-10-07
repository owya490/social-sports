import Footer from "@/components/Footer";

export const metadata = {
  title: "SPORTSHUB | Find your next social sport session!",
  description:
    "SPORTSHUB is a modern, not for profit platform for you to find, book and host your next social sports session. We make it easy for players to search for and book their sport session of choice and for organisers to seamlessly host their next session, with integrated booking and management systems. Try it out free today!",
};

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

      <div className="pb-8">{children}</div>

      <Footer />
    </>
  );
}
