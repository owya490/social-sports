import ClubCarousel from "./ClubCarousel";
import scroll from "./landingScroll.module.css";
import UpcomingSessionsReel from "./UpcomingSessionsReel";

/** Dark proof band: the clubs hosting on SPORTSHUB and their real upcoming sessions. */
export default function SportsClubsSection() {
  return (
    <section aria-labelledby="clubs-title" className="w-full bg-[#0a0a0a] py-24 text-white md:py-32">
      <div className={`mx-auto max-w-[1200px] px-6 text-center ${scroll.rise}`}>
        <h2 id="clubs-title" className="text-balance text-3xl font-bold tracking-[-0.02em] md:text-5xl">
          Trusted by sports clubs Australia wide
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-pretty font-light text-white/70">
          Volleyball, badminton, pickleball, basketball and more, run by the clubs below and booked every week.
        </p>
      </div>
      <div className="mt-12">
        <ClubCarousel />
      </div>
      <UpcomingSessionsReel />
    </section>
  );
}
