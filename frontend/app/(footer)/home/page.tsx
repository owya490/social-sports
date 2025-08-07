"use client";

import Link from "next/link";
import ImageHero from "./ImageHero";
import ImageHeroPhone from "./ImageHeroPhone";
import InfiniteCarousel from "./ClubCarousel";

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="w-full flex items-center justify-center bg-transparent">
        <div className="screen-width-dashboard">
          {/* Hero Section */}
          <div className="relative justify-center pt-24 md:pt-32">
            <div className=" px-6">
              {/* Text Content */}
              <div className="max-w-4xl">
                {/* Main Headline */}
                <h1 className="hidden md:block text-5xl font-bold text-core-text leading-tight mb-6">
                  SPORTSHUB is a purpose-built platform for sports communities
                </h1>
                <h1 className="md:hidden text-6xl font-bold text-core-text leading-tight mb-6 text-center">
                  Streamline your events
                </h1>

                {/* Subtitle */}
                <h2 className="hidden md:block max-w-2xl text-lg text-gray-600 font-normal leading-relaxed mb-8">
                  Connect players, organize events, and build thriving sports communities. Streamline bookings,
                  payments, team management and more.
                </h2>

                <h2 className="md:hidden text-lg text-gray-600 font-normal leading-relaxed mb-8 text-center">
                  Connect players, organize events, accept payments and build thriving sports communities.
                </h2>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/register"
                    className="bg-core-text text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors duration-200 text-center"
                  >
                    Start organising
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
      <ImageHeroPhone />

      {/* Features Preview Section - Layered on top of image */}

      {/* Tech Companies Section */}
      <div className="w-screen flex justify-center py-32 bg-white z-20 relative">
        <div className="screen-width-dashboard px-6 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-core-text mb-4">Trusted by sports clubs worldwide</h3>
          <p className="text-gray-600 mb-12 max-w-2xl mx-auto">
            Join innovative sports clubs already using SPORTSHUB to organize their events and build thriving communities
          </p>

        </div>
      </div>
      <div className="w-screen flex justify-center py-32 bg-white z-20 relative">
        <div className="md:screen-width-dashboard px-6 text-center">
          <InfiniteCarousel />
        </div>
      </div>

      {/* Payments Section */}
      <div className="w-screen flex justify-center pt-24 bg-white relative overflow-hidden">
        <div className="screen-width-dashboard px-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-black text-white px-4 py-1 text-xs font-medium mb-6 rounded-full">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
              INSTANT PAYMENTS
            </div>
            <h3 className="text-4xl md:text-5xl font-bold text-black mb-6 leading-tight">
              Get paid in{" "}
              <span className="relative">
                seconds
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-black"></div>
              </span>
              , not weeks
            </h3>
            <p className="text-xl text-gray-700 mb-8 leading-relaxed">
              Stripe-powered payments that process instantly. No waiting, no hassle. Just seamless transactions that
              keep your events running smooth.
            </p>
            <div className="flex items-center gap-6 text-gray-600 text-sm z-40">
              <span className="flex items-center gap-2">
                <div className="w-1 h-1 bg-black rounded-full"></div>
                0.2s average processing
              </span>
              <span className="flex items-center gap-2">
                <div className="w-1 h-1 bg-black rounded-full"></div>
                99.9% uptime
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden justify-center pb-16 block md:hidden">
        <div
          style={{
            width: "600px",
            position: "relative",
            inset: "0",
            borderRadius: "10px",
            background: "transparent",
            margin: "0px auto auto",
            transform: "scale(1) rotateX(40deg) rotateY(20deg) rotate(335deg)",
            overflow: "visible",
          }}
        >
          <img
            src="/images/mocks/stripe-checkout-mock.png"
            alt="Stripe checkout interface"
            style={{
              objectFit: "cover",
              borderRadius: "10px",
              display: "block",
            }}
          />
        </div>
      </div>
      <div className="overflow-hidden justify-center pb-16 translate-x-8 hidden md:block">
        <div
          style={{
            width: "1200px",
            position: "relative",
            inset: "0",
            borderRadius: "10px",
            background: "transparent",
            margin: "0px auto auto",
            transform: "scale(1) rotateX(40deg) rotateY(20deg) rotate(335deg)",
            overflow: "visible",
          }}
        >
          <img
            src="/images/mocks/stripe-checkout-mock.png"
            alt="Stripe checkout interface"
            style={{
              objectFit: "cover",
              borderRadius: "10px",
              display: "block",
            }}
          />
        </div>
      </div>

      {/* Feature Overview */}
      <div className="w-screen flex justify-center pb-24 bg-white">
        <div className="screen-width-dashboard px-6">
          <div className="relative max-w-4xl mx-auto">
            {/* T Border */}
            {/* Horizontal line across the top */}
            <div className="absolute top-0 left-0 right-0">
              <div className="w-full h-px bg-core-outline"></div>
            </div>
            {/* Vertical line down the center */}
            <div className="absolute top-0 bottom-0 left-1/2 transform -translate-x-1/2 hidden md:block">
              <div className="w-px h-full bg-core-outline"></div>
            </div>

            {/* Feature Cards */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 pt-2">
              {/* Feature 1 */}
              <div className="bg-white p-8">
                <h4 className="text-lg font-bold text-core-text mb-2">Manage events end to end</h4>
                <p className="text-gray-600 leading-relaxed text-xs font-light mb-4">
                  From creation to completion, handle every aspect of your events with SPORTSHUB. Streamline
                  registration, payments and more, all in one place.
                </p>
                <div className="relative">
                  <img
                    className="w-full h-auto border-t-[1px] border-core-outline border-l-[1px] rounded-tl-xl p-2"
                    src="/images/mocks/going-global-event-details-mock.png"
                    alt="Event management"
                  />
                  {/* Gradient overlays */}
                  <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-white to-transparent rounded-tl-xl pointer-events-none"></div>
                  <div className="absolute top-0 bottom-0 right-0 w-1/2 bg-gradient-to-l from-white to-transparent rounded-tl-xl pointer-events-none"></div>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="bg-white p-8">
                <h4 className="text-lg font-bold text-core-text mb-2">Gain the visibility you need</h4>
                <p className="text-gray-600 leading-relaxed text-xs font-light mb-2">
                  Get real-time insights into your events with detailed analytics and reporting. Track participation,
                  revenue, engagement metrics, and performance to make data-driven decisions.
                </p>
                <div className="w-full flex justify-center">
                  <img className="w-3/4 h-auto" src="/images/mocks/event-card-stack-mock.png" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="w-screen flex justify-center py-24 bg-gray-50">
        <div className="screen-width-dashboard px-6 text-center">
          <h3 className="text-4xl md:text-5xl font-bold text-core-text mb-6">Ready to transform your events?</h3>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of sports organizers already using SPORTSHUB to create memorable experiences and build
            thriving communities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-block bg-core-text text-white px-12 py-4 rounded-lg font-semibold text-lg hover:bg-gray-800 transition-colors duration-200"
            >
              Start organizing today
            </Link>
            <Link
              href="/dashboard"
              className="inline-block text-core-text px-12 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center gap-2"
            >
              Explore events
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 16 16">
                <path d="M5.46967 11.4697C5.17678 11.7626 5.17678 12.2374 5.46967 12.5303C5.76256 12.8232 6.23744 12.8232 6.53033 12.5303L10.5303 8.53033C10.8207 8.23999 10.8236 7.77014 10.5368 7.47624L6.63419 3.47624C6.34492 3.17976 5.87009 3.17391 5.57361 3.46318C5.27713 3.75244 5.27128 4.22728 5.56054 4.52376L8.94583 7.99351L5.46967 11.4697Z" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
