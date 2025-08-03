"use client";

import Link from "next/link";
import ImageHero from "./ImageHero";

export default function Home() {
  const isMdOrBelow = false; //useIsScreenBelow("md");

  return (
    <div className="min-h-screen">
      <div className="w-full flex items-center justify-center bg-transparent">
        <div className="screen-width-dashboard">
          {/* Hero Section */}
          <div className="relative justify-center pt-32">
            <div className=" px-6">
              {/* Text Content */}
              <div className="max-w-2xl">
                {/* Main Headline */}
                <h1 className="text-4xl font-bold text-core-text leading-tight mb-6">
                  SPORTSHUB is a purpose-built platform for sports communities
                </h1>

                {/* Subtitle */}
                <h2 className="text-md text-gray-600 font-normal leading-relaxed mb-8">
                  Connect players, organize events, and build thriving sports communities. Streamline bookings,
                  payments, and team management.
                </h2>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/register"
                    className="bg-core-text text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors duration-200 text-center"
                  >
                    Start building
                  </Link>
                  <Link
                    href="/dashboard"
                    className="text-core-text px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200 text-center flex items-center justify-center gap-2"
                  >
                    Explore events
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M5.46967 11.4697C5.17678 11.7626 5.17678 12.2374 5.46967 12.5303C5.76256 12.8232 6.23744 12.8232 6.53033 12.5303L10.5303 8.53033C10.8207 8.23999 10.8236 7.77014 10.5368 7.47624L6.63419 3.47624C6.34492 3.17976 5.87009 3.17391 5.57361 3.46318C5.27713 3.75244 5.27128 4.22728 5.56054 4.52376L8.94583 7.99351L5.46967 11.4697Z" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Image */}
      <ImageHero />

      {/* Features Preview Section - Layered on top of image */}
  
      <div className="w-screen flex justify-center py-24 bg-white z-20 relative">
        <div className="screen-width-dashboard px-6 text-center">
          <h3 className="text-3xl md:text-4xl font-bold text-core-text mb-6">
            Everything you need to run sports events
          </h3>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-12">
            From casual pickup games to professional tournaments, SportHub provides the tools to organize, manage, and
            grow your sporting community.
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-200">
              <h4 className="text-xl font-semibold text-core-text mb-3">Event Management</h4>
              <p className="text-gray-600">
                Create and manage sports events with ease. Handle registrations, payments, and communications all in one
                place.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-200">
              <h4 className="text-xl font-semibold text-core-text mb-3">Player Connections</h4>
              <p className="text-gray-600">
                Connect with other players, find teammates, and discover new sporting opportunities in your area.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-200">
              <h4 className="text-xl font-semibold text-core-text mb-3">Community Building</h4>
              <p className="text-gray-600">
                Build lasting sports communities with integrated social features and recurring event management.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="w-screen flex justify-center py-24">
        <div className="screen-width-dashboard px-6 text-center">
          <h3 className="text-4xl md:text-5xl font-bold text-core-text mb-6">Ready to get started?</h3>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of sports enthusiasts already using SportHub to organize and participate in amazing events.
          </p>
          <Link
            href="/register"
            className="inline-block bg-core-text text-white px-12 py-4 rounded-lg font-semibold text-lg hover:bg-gray-800 transition-colors duration-200"
          >
            Create your first event
          </Link>
        </div>
      </div>
    </div>
  );
}
