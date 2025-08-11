"use client";

import {
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  EnvelopeIcon,
  LinkIcon,
  QrCodeIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import InfiniteCarousel from "./ClubCarousel";
import FeatureTilesCarousel from "./FeatureTilesCarousel";
import FeatureTilesGrid from "./FeatureTilesGrid";
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
                <h1 className="md:hidden text-5xl font-bold text-core-text leading-tight mb-6 text-center">
                  Streamline your events
                </h1>

                {/* Subtitle */}
                <h2 className="hidden md:block max-w-2xl text-lg text-gray-600 font-normal leading-relaxed mb-8">
                  Connect players, organize events, and build thriving sports communities. Streamline bookings,
                  payments, team management and more.
                </h2>

                <h2 className="md:hidden text-sm text-gray-600 font-normal leading-relaxed mb-8 text-center">
                  Connect players, organize events, accept payments and build thriving sports communities.
                </h2>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/organiser/dashboard"
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

      {/* Sports Clubs Section */}
      <div className="w-screen flex justify-center pt-32 bg-white z-20 relative">
        <div className="screen-width-dashboard px-6 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-core-text mb-4">Trusted by sports clubs Australia wide</h3>
          <p className="text-gray-600 mb-16 max-w-2xl mx-auto">
            Join innovative sports clubs already using SPORTSHUB to organize their events and build thriving
            communities.
          </p>
        </div>
      </div>
      <div className="w-screen flex justify-center bg-white z-20 relative pb-28">
        <div className="md:screen-width-dashboard px-6 text-center">
          <InfiniteCarousel />
        </div>
      </div>

      {/* Modern Feature Tiles (light) under Sports Clubs */}
      <div className="w-screen bg-white text-core-text flex justify-center pt-8 pb-24 relative">
        <div className="screen-width-dashboard px-6">
          <div className="max-w-4xl">
            <h3 className="text-4xl md:text-6xl font-bold leading-tight">Made for modern sports communities</h3>
            <p className="text-gray-600 mt-4 max-w-2xl">
              Built with fast execution, relentless focus and a commitment to quality. Switch to a platform crafted for
              clubs, organisers and players.
            </p>
            <a
              href="/organiser/dashboard"
              className="inline-flex items-center gap-2 text-core-text hover:text-black mt-4 text-sm"
            >
              Make the switch
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                <path d="M5.46967 11.4697C5.17678 11.7626 5.17678 12.2374 5.46967 12.5303C5.76256 12.8232 6.23744 12.8232 6.53033 12.5303L10.5303 8.53033C10.8207 8.23999 10.8236 7.77014 10.5368 7.47624L6.63419 3.47624C6.34492 3.17976 5.87009 3.17391 5.57361 3.46318C5.27713 3.75244 5.27128 4.22728 5.56054 4.52376L8.94583 7.99351L5.46967 11.4697Z" />
              </svg>
            </a>
          </div>

          {/* Mobile carousel */}
          <div className="md:hidden mt-6">
            <FeatureTilesCarousel />
          </div>

          {/* Desktop grid */}
          <FeatureTilesGrid />
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
            <p className="text-xl text-black font-thin mb-8 leading-relaxed">
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
      <div className="overflow-hidden justify-center pb-8 translate-x-8 hidden md:block">
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
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 pt-2">
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
                  Get more views on your event with SPORTSHUB — the one-stop shop for sports players. Boost your
                  event&apos;s visibility and manage everything easily with our powerful organiser platform.
                </p>
                <div className="w-full flex justify-center">
                  <img className="w-3/4 h-auto" src="/images/mocks/event-card-stack-mock.png" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Create Section */}
      <div className="w-screen flex justify-center pt-24 bg-white relative overflow-hidden">
        <div className="screen-width-dashboard px-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-black text-white px-4 py-1 text-xs font-medium mb-6 rounded-full">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
              ADVANCED EVENT CREATION
            </div>
            <h3 className="text-4xl md:text-5xl font-bold text-black mb-6 leading-tight">
              Flexible{" "}
              <span className="relative">
                event creation
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-black"></div>
              </span>
            </h3>
            <p className="text-xl text-black font-thin mb-8 leading-relaxed">
              Set time, location, capacity, pricing, form fields and more — everything in one simple builder. Make your
              events pop with our powerful event creation.
            </p>
            <div className="flex items-center gap-6 text-gray-600 text-sm z-40">
              <span className="flex items-center gap-2">
                <div className="w-1 h-1 bg-black rounded-full"></div>
                Recurring Events
              </span>
              <span className="flex items-center gap-2">
                <div className="w-1 h-1 bg-black rounded-full"></div>
                Pricing & Capacity
              </span>
              <span className="flex items-center gap-2">
                <div className="w-1 h-1 bg-black rounded-full"></div>
                Custom Form Fields
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="overflow-hidden flex justify-center z-20 w-full mt-8 md:mt-0">
        <div className="screen-width-dashboard">
          <div
            className="-translate-y-16 lg:-translate-y-28"
            style={{ perspective: "1500px", transformStyle: "preserve-3d" }}
          >
            <div className="flex justify-center" style={{ transform: "rotateX(50deg)" }}>
              <div
                style={{
                  imageRendering: "auto",
                  width: "100%",
                  position: "relative",
                  inset: "0",
                  //just border radius top corners
                  borderTopLeftRadius: "20px",
                  borderTopRightRadius: "20px",
                  borderTop: "1px solid lightgray",
                  borderLeft: "1px solid lightgray",
                  borderRight: "1px solid lightgray",
                  paddingTop: "20px",
                  background: "transparent",
                  margin: "0px auto auto",
                  transformStyle: "preserve-3d",
                  // transform: "rotateX(40deg) rotateY(0deg)",
                  overflow: "visible",
                  willChange: "transform",
                }}
              >
                <img
                  src="/images/mocks/event-create-mock-4.png"
                  alt="Event creation interface"
                  style={{
                    objectFit: "cover",
                    borderRadius: "20px",
                    display: "block",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Overview: Additional */}
      <div className="w-screen flex justify-center pb-24 bg-white relative">
        <div className="absolute -top-16 md:-top-64 left-0 right-0 h-32 md:h-64 bg-gradient-to-t from-white to-transparent pointer-events-none z-40"></div>
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
            {/* <div className="absolute bottom-0 left-0 right-0">
              <div className="w-full h-px bg-core-outline"></div>
            </div> */}

            {/* Feature Cards */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 pt-2">
              {/* Feature: Cross-platform multi search */}
              <div className="bg-white p-8">
                <h4 className="text-lg font-bold text-core-text mb-2">Cross-platform multi search</h4>
                <p className="text-gray-600 leading-relaxed text-xs font-light mb-4">
                  Search events, players, and clubs across web and mobile in one unified flow. lightning-fast results
                  and rich filters to help you find exactly what you need.
                </p>
                <div className="relative">
                  <img
                    className="w-full h-auto border-t-[1px] border-core-outline border-l-[1px] rounded-tl-xl p-2"
                    src="/images/mocks/search-bar-mock-v3.png"
                    alt="Event management"
                  />
                  {/* Gradient overlays */}
                  <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-white to-transparent rounded-tl-xl pointer-events-none"></div>
                  <div className="absolute top-0 bottom-0 right-0 w-1/4 bg-gradient-to-l from-white to-transparent rounded-tl-xl pointer-events-none"></div>
                </div>
              </div>

              {/* Feature: Feature requests at your fingertips */}
              <div className="bg-white p-8">
                <h4 className="text-lg font-bold text-core-text mb-2">Feature requests at your fingertips</h4>
                <p className="text-gray-600 leading-relaxed text-xs font-light mb-4">
                  Our features are shaped by the needs of our community. If you have an idea or need a new feature, just
                  reach out—SPORTSHUB is built for you, with you.
                </p>
                <div className="relative">
                  <img
                    className="w-full h-auto border-t-[1px] border-core-outline border-l-[1px] rounded-tl-xl "
                    src="/images/mocks/business-card-mock.png"
                    alt="Event management"
                  />
                  {/* Gradient overlays */}
                  <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-white to-transparent rounded-tl-xl pointer-events-none"></div>
                  <div className="absolute top-0 bottom-0 right-0 w-1/2 bg-gradient-to-l from-white to-transparent rounded-tl-xl pointer-events-none"></div>
                </div>{" "}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Overview: Six Panels */}
      <div className="w-screen flex justify-center py-24 bg-white">
        <div className="screen-width-dashboard px-6">
          <div className="relative max-w-4xl mx-auto">
            <div className="max-w-2xl mb-6">
              <div className="inline-flex items-center gap-2 bg-black text-white px-3 py-1 text-xs font-medium rounded-full mb-3">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                CORE FEATURES
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-core-text">Everything you need to run your events</h3>
              <p className="text-black font-thin mt-2 text-sm md:text-base">
                Modern tools for organisers, clubs and communities.
              </p>
            </div>
            {/* Feature Cards */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 items-stretch gap-2 md:gap-12 pt-2">
              <div className="bg-white p-4 md:p-8">
                <div className="flex items-start gap-3 mb-2">
                  <CalendarDaysIcon className="w-5 h-5 mt-0.5 text-core-text" />
                  <h4 className="text-lg font-bold text-core-text">Recurring Events</h4>
                </div>
                <p className="text-gray-600 leading-relaxed text-xs font-light">
                  Schedule once, repeat automatically with flexible rules for daily, weekly, or fortnightly.
                </p>
              </div>
              <div className="bg-white p-4 md:p-8">
                <div className="flex items-start gap-3 mb-2">
                  <ClipboardDocumentListIcon className="w-5 h-5 mt-0.5 text-core-text" />
                  <h4 className="text-lg font-bold text-core-text">Custom Forms</h4>
                </div>
                <p className="text-gray-600 leading-relaxed text-xs font-light">
                  Collect exactly what you need with drag-and-drop fields and validation.
                </p>
              </div>
              <div className="bg-white p-4 md:p-8">
                <div className="flex items-start gap-3 mb-2">
                  <LinkIcon className="w-5 h-5 mt-0.5 text-core-text" />
                  <h4 className="text-lg font-bold text-core-text">Custom Links</h4>
                </div>
                <p className="text-gray-600 leading-relaxed text-xs font-light">
                  Create branded, trackable links for events, forms and teams.
                </p>
              </div>
              <div className="bg-white p-4 md:p-8">
                <div className="flex items-start gap-3 mb-2">
                  <Squares2X2Icon className="w-5 h-5 mt-0.5 text-core-text" />
                  <h4 className="text-lg font-bold text-core-text">Organiser Platform</h4>
                </div>
                <p className="text-gray-600 leading-relaxed text-xs font-light">
                  All-in-one dashboard for events, payments, participants and communication.
                </p>
              </div>
              <div className="bg-white p-4 md:p-8">
                <div className="flex items-start gap-3 mb-2">
                  <EnvelopeIcon className="w-5 h-5 mt-0.5 text-core-text" />
                  <h4 className="text-lg font-bold text-core-text">Email Reminders</h4>
                </div>
                <p className="text-gray-600 leading-relaxed text-xs font-light">
                  Automated reminders and confirmations to keep everyone in the loop.
                </p>
              </div>
              <div className="bg-white p-4 md:p-8">
                <div className="flex items-start gap-3 mb-2">
                  <QrCodeIcon className="w-5 h-5 mt-0.5 text-core-text" />
                  <h4 className="text-lg font-bold text-core-text">QR Code Tickets</h4>
                </div>
                <p className="text-gray-600 leading-relaxed text-xs font-light">
                  Instant scannable tickets for faster check-in and tighter security.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tech-centric Platform Section */}
      <div className="w-screen flex justify-center py-24 bg-gray-50">
        <div className="screen-width-dashboard px-6 text-center">
          <h3 className="text-3xl md:text-4xl font-bold text-core-text mb-3">
            The world’s first tech‑centric sports event platform
          </h3>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Built on a modern, battle‑tested stack for speed, reliability and scale.
          </p>
          <div className="flex-col md:flex-row flex-wrap flex items-center justify-center gap-x-10 gap-y-6">
            <img src="/vercel.svg" alt="Vercel" className="h-6 w-auto" />
            <img src="/next.svg" alt="Next.js" className="h-6 w-auto" />
            <img src="/images/company-logos/firebase.svg" alt="Firebase" className="h-6 w-auto" />
            <img src="/images/company-logos/google-maps.png" alt="Google Maps" className="h-6 w-auto" />
            <img src="/images/company-logos/stripe.png" alt="Stripe" className="h-6 w-auto" />
            <img src="/images/company-logos/loops.png" alt="Loops" className="h-6 w-auto" />
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="w-screen flex justify-center pt-12 pb-28 bg-gray-50">
        <div className="screen-width-dashboard px-6 text-center">
          <h3 className="text-4xl md:text-5xl font-bold text-core-text mb-6">Ready to transform your events?</h3>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of sports organizers already using SPORTSHUB to create memorable experiences and build
            thriving communities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/organiser/dashboard"
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
