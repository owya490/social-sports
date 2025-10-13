import Footer from "@/components/Footer";
import Script from "next/script";
import type { Metadata } from "next";

export const metadata: Metadata = {
	  title: "SPORTSHUB | Find your next social sport session!",
	  description: "Sportshub helps you find and book local sports events. Explore upcoming tournaments, register easily, and enjoy the game.",
	  openGraph: {
	    title: "SPORTSHUB | Find your next social sport session!",
	    description: "Sportshub helps you find and book local sports events. Explore upcoming tournaments, register easily, and enjoy the game.",
	    type: "website",
	    url: "https://www.sportshub.net.au",
	    images: [
	      {
	        url: "https://www.sportshub.net.au/images/logo.png",
	        width: 1200,
	        height: 630,
	        alt: "SPORTSHUB Logo"
	      }
	    ],
	    siteName: "SPORTSHUB"
	  },
	  robots: {
	    index: true,
	    follow: true
	  }
	};
	
	export default function RootLayout({ children }: { children: React.ReactNode }) {
	  return (
	    <>
	      <Script
	        id="footer-organization-structured-data"
	        type="application/ld+json"
	        strategy="afterInteractive"
	      >
	        {toJsonLd({
	          "@context": "https://schema.org",
	          "@type": "Organization",
	          name: "SPORTSHUB",
	          url: "https://www.sportshub.net.au",
	          logo: "https://www.sportshub.net.au/images/logo.png",
	          sameAs: [
	            "https://www.instagram.com/sportshub.net.au/",
	            "https://www.linkedin.com/company/sportshub-au"
	          ]
	        })}
	      </Script>
	
	      <div className="pb-[var(--footer-height)]">{children}</div>
	
	      <Footer />
	    </>
	  );
	}
	
	function toJsonLd(data: unknown) {
	  return JSON.stringify(data);
	}