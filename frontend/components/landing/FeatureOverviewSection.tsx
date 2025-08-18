export default function FeatureOverviewSection() {
  return (
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
                From creation to completion, handle every aspect of your events with SPORTSHUB. Streamline registration,
                payments and more, all in one place.
              </p>
              <div className="relative">
                <img
                  className="w-full h-auto border-t-[1px] border-core-outline border-l-[1px] rounded-tl-xl p-2"
                  src="/images/mocks/going-global-event-details-mock.png"
                  alt="Event management"
                />
                {/* Gradient overlays */}
                <div className="absolute bottom-0 left-0 right-0 h-1/5 bg-gradient-to-t from-white to-transparent rounded-tl-xl pointer-events-none"></div>
                <div className="absolute top-0 bottom-0 right-0 w-1/5 bg-gradient-to-l from-white to-transparent rounded-tl-xl pointer-events-none"></div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8">
              <h4 className="text-lg font-bold text-core-text mb-2">Gain the visibility you need</h4>
              <p className="text-gray-600 leading-relaxed text-xs font-light mb-2">
                Get more traction on your event with SPORTSHUB. Boost your event&apos;s visibility and get more players
                with SPORTSHUB being the one-stop shop for social sport events.
              </p>
              <div className="w-full flex justify-center">
                <img className="w-3/4 h-auto" src="/images/mocks/event-card-stack-mock.png" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
