import Link from "next/link";

export default function FinalCTASection() {
  return (
    <div className="w-screen flex justify-center pt-12 pb-28 bg-gray-50">
      <div className="screen-width-dashboard px-6 text-center">
        <h3 className="text-4xl md:text-5xl font-bold text-core-text mb-6">Ready to transform your events?</h3>
        <p className="text-xl font-light text-gray-600 mb-8 max-w-2xl mx-auto">
          Join thousands of sports organizers already using SPORTSHUB to create memorable experiences and build thriving
          communities.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/organiser/dashboard"
            className="inline-block bg-core-text text-white px-12 py-4 rounded-lg font-semibold text-lg hover:bg-gray-800 transition-colors duration-200"
          >
            Start organizing today
          </Link>
          <Link
            href="/"
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
  );
}
