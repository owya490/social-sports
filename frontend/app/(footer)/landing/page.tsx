"use client";

import AdditionalFeaturesSection from "../../../components/landing/AdditionalFeaturesSection";
import CoreFeaturesSection from "../../../components/landing/CoreFeaturesSection";
import EventCreateSection from "../../../components/landing/EventCreateSection";
import FeatureOverviewSection from "../../../components/landing/FeatureOverviewSection";
import FeatureTilesSection from "../../../components/landing/FeatureTilesSection";
import FinalCTASection from "../../../components/landing/FinalCTASection";
import HeroSection from "../../../components/landing/HeroSection";
import ImageHero from "../../../components/landing/ImageHero";
import ImageHeroPhone from "../../../components/landing/ImageHeroPhone";
import PaymentsSection from "../../../components/landing/PaymentsSection";
import SportsClubsSection from "../../../components/landing/SportsClubsSection";
import TechPlatformSection from "../../../components/landing/TechPlatformSection";

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <HeroSection />

      {/* Hero Image */}
      <ImageHero />
      <ImageHeroPhone />

      {/* Features Preview Section - Layered on top of image */}

      <SportsClubsSection />

      {/* Modern Feature Tiles (light) under Sports Clubs */}
      <FeatureTilesSection />

      <PaymentsSection />

      {/* Feature Overview */}
      <FeatureOverviewSection />

      <EventCreateSection />

      {/* Feature Overview: Additional */}
      <AdditionalFeaturesSection />

      {/* Feature Overview: Six Panels */}
      <CoreFeaturesSection />

      {/* Tech-centric Platform Section */}
      <TechPlatformSection />

      {/* Final CTA Section */}
      <FinalCTASection />
    </div>
  );
}
