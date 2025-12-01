import { FeaturedEvents } from "@/components/events/FeaturedEvents";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Volleyball Events in Sydney | SPORTSHUB",
  description:
    "Discover upcoming volleyball events in Sydney, from casual beach games to competitive indoor leagues. Find and join volleyball sessions near you.",
  openGraph: {
    title: "Volleyball Events in Sydney | SPORTSHUB",
    description:
      "Discover upcoming volleyball events in Sydney, from casual beach games to competitive indoor leagues. Find and join volleyball sessions near you.",
    type: "website",
    url: "https://sportshub.net.au/featured/sydney/volleyball",
    images: [
      {
        url: "https://sportshub.net.au/images/volleyball-art.png", // Using a general volleyball image for the overview
        width: 1200,
        height: 630,
        alt: "Volleyball in Sydney",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function VolleyballSydneyPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16 text-gray-900">
      <header className="mb-10 text-left md:flex md:items-center md:justify-between">
        <div className="md:w-1/2 md:pr-8">
          <p className="text-xl font-semibold text-gray-800">Volleyball Events in</p>
          <h1 className="text-6xl font-extrabold text-gray-900 mt-2">Sydney</h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-600 font-satoshi">
            Find exciting volleyball events in Sydney to connect with people who share your interests. Whether you're
            looking for casual games or competitive leagues, SPORTSHUB helps you find and join like-minded players.
          </p>
        </div>
        <div className="md:w-1/2 mt-8 md:mt-0">
          <Image
            src="/images/volleyball-art.png"
            alt="Volleyball overview in Sydney"
            width={600}
            height={400}
            className="rounded-xl shadow-lg w-full h-auto"
          />
        </div>
      </header>

      <FeaturedEvents sport="volleyball" />

      <section className="mt-16 bg-organiser-light-gray rounded-xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center">
          <div className="text-4xl mr-4">🏐</div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Organize your own event in Sydney</h2>
            <p className="text-gray-700 mt-1">
              Bring people together around what you love. Create an event, host events, and build your community.
            </p>
          </div>
        </div>
        <Link href="/event/create" passHref className="w-full md:w-auto">
          <button className="w-full md:w-auto bg-highlight-yellow text-core-text font-semibold py-3 px-6 rounded-full hover:opacity-90 transition-opacity font-satoshi">
            Create your event
          </button>
        </Link>
      </section>

      <section className="mt-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center font-satoshi">
          Checkout other sports in Sydney
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8">
          {/* Badminton Card */}
          <Link href="/featured/sydney/badminton" passHref>
            <div className="cursor-pointer rounded-lg shadow-md overflow-hidden bg-white hover:scale-[1.02] transition-all duration-300">
              <div className="relative h-48 w-full bg-gray-100">
                <Image src="/images/badminton.png" alt="Badminton in Sydney" layout="fill" objectFit="cover" />
              </div>
              <div className="p-4">
                <h3 className="text-xl font-bold text-gray-900 font-satoshi">Badminton</h3>
                <p className="text-gray-600 font-satoshi">Find badminton events and groups near you.</p>
              </div>
            </div>
          </Link>

          {/* Social Sports Card */}
          <Link href="/featured/sydney/social_sports" passHref>
            <div className="cursor-pointer rounded-lg shadow-md overflow-hidden bg-white hover:scale-[1.02] transition-all duration-300">
              <div className="relative h-48 w-full bg-gray-100">
                <Image
                  src="/images/minimalist-sport.webp" // Generic image for social sports
                  alt="Social Sports in Sydney"
                  layout="fill"
                  objectFit="cover"
                />
              </div>
              <div className="p-4">
                <h3 className="text-xl font-bold text-gray-900 font-satoshi">Social Sports</h3>
                <p className="text-gray-600 font-satoshi">Explore a variety of social sports events.</p>
              </div>
            </div>
          </Link>
        </div>
      </section>
    </main>
  );
}
