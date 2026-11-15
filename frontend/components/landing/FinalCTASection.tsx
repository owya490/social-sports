import Image from "next/image";
import Link from "next/link";
import scroll from "./landingScroll.module.css";

/** Basketball half-court markings framing the close: the page ends at centre court. */
function CentreCourt() {
  const line = { pathLength: 1, className: scroll.drawLine };
  return (
    <svg
      aria-hidden
      viewBox="0 0 1200 700"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      style={{
        filter: "url(#court-paint-night)",
        maskImage: "radial-gradient(ellipse 42% 40% at 50% 50%, transparent 80%, #000 100%)",
        WebkitMaskImage: "radial-gradient(ellipse 42% 40% at 50% 50%, transparent 80%, #000 100%)",
      }}
      fill="none"
      stroke="rgba(255,246,228,0.5)"
      strokeWidth="2"
    >
      <defs>
        <filter id="court-paint-night" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" result="d" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -2.2 2.1" result="m" />
          <feComposite in="d" in2="m" operator="in" />
        </filter>
      </defs>
      <rect x="60" y="70" width="1080" height="560" rx="2" {...line} />
      <path d="M600 70 V630" {...line} />
      <circle cx="600" cy="350" r="250" {...line} />
      <circle cx="600" cy="350" r="70" {...line} />
      <path d="M60 255 H260 V445 H60" {...line} />
      <path d="M1140 255 H940 V445 H1140" {...line} />
      <path d="M60 100 H150 A250 250 0 0 1 150 600 H60" {...line} />
      <path d="M1140 100 H1050 A250 250 0 0 0 1050 600 H1140" {...line} />
    </svg>
  );
}

export default function FinalCTASection() {
  return (
    <section aria-labelledby="final-cta-title" className="relative w-full overflow-clip bg-white py-36 text-white md:py-48">
      <div aria-hidden className={`absolute inset-0 bg-[#0a0a0a] ${scroll.reveal}`}>
        <div className={`absolute inset-0 ${scroll.revealInner}`}>
        <Image
          aria-hidden
          src="/images/landing/court-floor-night.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-[50%_80%] brightness-[0.75] md:brightness-100"
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 50%, rgba(10,10,10,0.86), rgba(10,10,10,0.25) 92%)",
          }}
        />
        <CentreCourt />
        </div>
      </div>
      <div className={`relative mx-auto max-w-[1200px] px-6 text-center ${scroll.rise}`}>
        <h2 id="final-cta-title" className="text-balance text-4xl font-bold tracking-[-0.03em] md:text-6xl">
          Your next session starts here.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-pretty text-lg font-light text-white md:text-xl">
          Join the clubs and organisers already using SPORTSHUB to fill their sessions and build thriving communities.
        </p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/organiser/v2/dashboard"
            className="rounded-xl bg-accent px-10 py-4 text-lg font-semibold text-accent-contrast transition-[filter] duration-200 hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            Start organising today
          </Link>
          <Link
            href="/"
            className="group flex items-center justify-center gap-2 rounded-xl px-10 py-4 text-lg font-semibold text-white transition-colors duration-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Explore events
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
