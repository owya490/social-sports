import Link from "next/link";

export default function HeroSection() {
  return (
    <div className="w-full flex items-center justify-center bg-transparent">
      <div className="screen-width-dashboard">
        {/* Hero Section */}
        <div className="relative justify-center pt-24 md:pt-32">
          <div className="md:px-6">
            {/* Text Content */}
            <div className="max-w-4xl">
              {/* Main Headline */}
              <h1 className="hidden md:block text-5xl font-bold text-core-text leading-tight mb-6">
                SPORTSHUB is a purpose-built platform for sports communities
              </h1>
              <h1 className="md:hidden text-5xl font-bold text-core-text leading-tight mb-6 text-center">
                Streamline your sports events
              </h1>
              <div className="px-6 md:px-0">
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
    </div>
  );
} 