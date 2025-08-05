"use client";

import Link from "next/link";
import ImageHero from "./ImageHero";
import ImageHeroPhone from "./ImageHeroPhone";

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
          <h3 className="text-2xl md:text-3xl font-bold text-core-text mb-4">Trusted by leading tech companies</h3>
          <p className="text-gray-600 mb-12 max-w-2xl mx-auto">
            Join innovative companies already using SPORTSHUB to organize their corporate events and team activities
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6 items-start justify-items-center opacity-70 max-w-5xl mx-auto">
            {/* Google */}
            <div className="flex items-center justify-center gap-4 w-full">
              <div className="w-8 h-8 flex-shrink-0">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="black"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="black"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="black"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="black"
                  />
                </svg>
              </div>
              <span className="text-lg font-bold text-gray-800">Google</span>
            </div>

            {/* Microsoft */}
            <div className="flex items-center justify-center gap-4 w-full">
              <div className="w-8 h-8 flex-shrink-0">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                  <rect x="1" y="1" width="10" height="10" fill="black" />
                  <rect x="13" y="1" width="10" height="10" fill="black" />
                  <rect x="1" y="13" width="10" height="10" fill="black" />
                  <rect x="13" y="13" width="10" height="10" fill="black" />
                </svg>
              </div>
              <span className="text-lg font-bold text-gray-800">Microsoft</span>
            </div>

            {/* Apple */}
            <div className="flex items-center justify-center gap-4 w-full">
              <div className="w-8 h-8 flex-shrink-0">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
                    fill="black"
                  />
                </svg>
              </div>
              <span className="text-lg font-bold text-gray-800">Apple</span>
            </div>

            {/* Netflix */}
            <div className="flex items-center justify-center gap-4 w-full">
              <div className="w-8 h-8 flex-shrink-0">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5.398 0v.006c3.028 8.556 5.37 15.175 8.348 23.596 2.344.058 4.85.398 4.854.398-2.8-7.924-5.923-16.747-8.487-24zm8.489 0v9.63L18.6 22.951c-.043-7.86-.004-15.71.002-22.95zM5.398 1.05V24c2.873-.086 5.928-.382 8.487-.618V13.388z"
                    fill="black"
                  />
                </svg>
              </div>
              <span className="text-lg font-bold text-gray-800">Netflix</span>
            </div>

            {/* Spotify */}
            <div className="flex items-center justify-center gap-4 w-full">
              <div className="w-8 h-8 flex-shrink-0">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"
                    fill="black"
                  />
                </svg>
              </div>
              <span className="text-lg font-bold text-gray-800">Spotify</span>
            </div>

            {/* Slack */}
            <div className="flex items-center justify-center gap-4 w-full">
              <div className="w-8 h-8 flex-shrink-0">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"
                    fill="black"
                  />
                </svg>
              </div>
              <span className="text-lg font-bold text-gray-800">Slack</span>
            </div>
          </div>
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
                <p className="text-gray-600 leading-relaxed text-xs font-light">
                  Get real-time insights into your events with detailed analytics and reporting. Track participation,
                  revenue, engagement metrics, and performance to make data-driven decisions.
                </p>
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
