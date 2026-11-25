import FinalCTASection from "@/components/landing/FinalCTASection";
import HeroSection from "@/components/landing/HeroSection";
import scroll from "@/components/landing/landingScroll.module.css";
import PricingComparisonSection from "@/components/landing/PricingComparisonSection";
import SessionStory from "@/components/landing/SessionStory";
import SportsClubsSection from "@/components/landing/SportsClubsSection";
import StatementLine from "@/components/landing/StatementLine";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SPORTSHUB for organisers | Bookings, payments and payouts for social sport",
  description:
    "Post social sport sessions, take bookings and payments, and get paid out. 2.65% + 30¢ per booking, which players can cover, with no subscription.",
  alternates: { canonical: "/landing" },
};

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-clip bg-white">
      <div aria-hidden className={scroll.progress} />
      <HeroSection />
      <SportsClubsSection />
      <StatementLine />
      <SessionStory />
      <PricingComparisonSection />
      <FinalCTASection />
    </div>
  );
}
