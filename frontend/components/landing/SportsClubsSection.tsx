import ClubCarousel from "./ClubCarousel";

export default function SportsClubsSection() {
  return (
    <>
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
          <ClubCarousel />
        </div>
      </div>
    </>
  );
}
