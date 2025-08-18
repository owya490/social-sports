"use client";

export default function AdditionalFeaturesSection() {
  return (
    <div className="w-screen flex justify-center pb-24 bg-white relative">
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
                Search events, players, and clubs across web and mobile in one unified flow. lightning-fast results and
                rich filters to help you find exactly what you need.
              </p>
              <div className="relative w-full h-44 md:h-52 border-t-[1px] border-core-outline border-l-[1px] rounded-tl-xl">
                <img className="w-full h-auto  p-2" src="/images/mocks/search-bar-mock-v3.png" alt="Event management" />
                {/* Gradient overlays */}
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1/5 bg-gradient-to-t from-white to-transparent rounded-tl-xl pointer-events-none"></div>
              <div className="absolute top-0 bottom-0 right-0 w-1/5 bg-gradient-to-l from-white to-transparent rounded-tl-xl pointer-events-none"></div>
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
                <div className="absolute bottom-0 left-0 right-0 h-1/5 bg-gradient-to-t from-white to-transparent rounded-tl-xl pointer-events-none"></div>
                <div className="absolute top-0 bottom-0 right-0 w-1/5 bg-gradient-to-l from-white to-transparent rounded-tl-xl pointer-events-none"></div>
              </div>{" "}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
