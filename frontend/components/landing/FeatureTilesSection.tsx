import FeatureTilesCarousel from "./FeatureTilesCarousel";
import FeatureTilesGrid from "./FeatureTilesGrid";

export default function FeatureTilesSection() {
  return (
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
  );
}
