"use client";

import AdditionalFeaturesSection from "./AdditionalFeaturesSection";
import CoreFeaturesSection from "./CoreFeaturesSection";
import EventCreateSection from "./EventCreateSection";
import FeatureOverviewSection from "./FeatureOverviewSection";
import FeatureTilesSection from "./FeatureTilesSection";
import FinalCTASection from "./FinalCTASection";
import HeroSection from "./HeroSection";
import ImageHero from "./ImageHero";
import ImageHeroPhone from "./ImageHeroPhone";
import PaymentsSection from "./PaymentsSection";
import SportsClubsSection from "./SportsClubsSection";
import TechPlatformSection from "./TechPlatformSection";

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
