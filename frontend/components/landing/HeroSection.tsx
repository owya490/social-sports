import Image from "@/components/elements/AppImage";
import desktopScreen from "@/public/images/mocks/sportshub-mac-web-mock.png";
import phoneScreen from "@/public/images/mocks/sportshub-iphone-web-mock.png";
import Link from "next/link";
import Court from "./Court";
import scroll from "./landingScroll.module.css";

export default function HeroSection() {
  return (
    <section aria-labelledby="landing-hero-title" className="w-full overflow-hidden bg-white">
      <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-6 pb-20 pt-14 lg:grid-cols-[1fr_1.15fr] lg:gap-16 lg:pb-28 lg:pt-24">
        <div>
          <h1
            id="landing-hero-title"
            className="text-balance text-[clamp(2.5rem,5.2vw,4rem)] font-bold leading-[1.02] tracking-[-0.03em] text-core-text"
          >
            Host, book and play social sport, all in one place
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-lg font-light leading-relaxed text-gray-600">
            SPORTSHUB is where clubs post sessions, take bookings and payments, and get paid out, and where players find
            a game near them. No subscription.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/organiser/v2/dashboard"
              className="rounded-xl bg-core-text px-6 py-3 text-center font-medium text-white transition-colors duration-200 hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
            >
              Start organising
            </Link>
            <Link
              href="/"
              className="group flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-medium text-core-text transition-colors duration-200 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Explore events
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </Link>
          </div>
        </div>

        <div className={`relative aspect-[5/6] w-full sm:aspect-[5/4] ${scroll.heroTilt}`}>
          <div
            aria-hidden
            className={`absolute right-0 top-0 h-[94%] w-[94%] overflow-hidden rounded-[28px] shadow-[0_2px_8px_rgba(10,10,10,0.12),0_40px_70px_-30px_rgba(10,10,10,0.55)] ${scroll.parallaxBack}`}
          >
            <Court
              kind="basketball"
              tone="hardwood"
              drawOn="load"
              keyFill="rgba(242,183,5,0.6)"
              lineScale={1.7}
              alignX="Max"
              priority
              surfaceSizes="(min-width: 1024px) 760px, 90vw"
              surface={{
                src: "/images/landing/court-floor-warm.webp",
                filter: "saturate(0.5) brightness(0.88) contrast(1.1)",
                shade:
                  "linear-gradient(rgba(10,10,10,0.2), rgba(10,10,10,0.2)), radial-gradient(55% 50% at 42% 62%, rgba(10,10,10,0.42), rgba(10,10,10,0) 100%), radial-gradient(80% 90% at 55% 40%, rgba(10,10,10,0), rgba(10,10,10,0.28) 100%)",
              }}
            />
          </div>
          <div className={`absolute bottom-[8%] left-0 w-[80%] ${scroll.parallaxFront}`}>
            <div className="overflow-hidden rounded-xl shadow-[0_2px_6px_rgba(10,10,10,0.15),0_26px_40px_-14px_rgba(10,10,10,0.55),0_60px_80px_-30px_rgba(10,10,10,0.45)]">
              <Image src={desktopScreen} alt="SPORTSHUB events page on desktop" sizes="(min-width: 1024px) 520px, 80vw" />
            </div>
          </div>
          <div className={`absolute bottom-0 right-[5%] w-[23%] ${scroll.parallaxFront}`}>
            <div className="overflow-hidden rounded-[20px] shadow-[0_2px_6px_rgba(10,10,10,0.1),0_24px_48px_-20px_rgba(10,10,10,0.5)]">
              <Image src={phoneScreen} alt="SPORTSHUB events page on mobile" sizes="(min-width: 1024px) 150px, 25vw" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
