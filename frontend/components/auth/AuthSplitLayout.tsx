import { ReactNode } from "react";

export const AUTH_INPUT_CLASS =
  "block w-full rounded-lg border-0 py-2.5 text-core-text shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black sm:leading-6";

export const AUTH_SUBMIT_CLASS =
  "flex w-full justify-center rounded-lg bg-core-text text-white px-3 py-2.5 font-semibold leading-6 border border-core-text hover:bg-white hover:text-core-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-core-text transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed";

interface AuthSplitLayoutProps {
  children: ReactNode;
  ctaEyebrow: string;
  ctaTitle: string;
  ctaBody: string;
}

const TOPOGRAPHIC_RINGS = Array.from({ length: 16 }, (_, index) => index + 1);

export default function AuthSplitLayout({ children, ctaEyebrow, ctaTitle, ctaBody }: AuthSplitLayoutProps) {
  return (
    <div className="flex min-h-[calc(100vh-var(--navbar-height)-var(--footer-height))] w-full items-center justify-center bg-surface px-4 py-16 sm:px-6 sm:py-24">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-core-outline bg-white md:grid-cols-2">
        <div className="order-1 flex flex-col justify-center px-6 py-8 sm:px-12 sm:py-10 lg:px-14">{children}</div>
        <AuthCtaPanel eyebrow={ctaEyebrow} title={ctaTitle} body={ctaBody} />
      </div>
    </div>
  );
}

function AuthCtaPanel({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div className="relative order-2 flex min-h-[200px] overflow-hidden bg-foreground text-white sm:min-h-[280px] md:min-h-full">
      <TopographicBackdrop />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
      <div className="relative z-10 mt-auto flex w-full flex-col justify-end p-8 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">{eyebrow}</p>
        <h2 className="mt-3 max-w-md text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{title}</h2>
        <p className="mt-4 max-w-md text-sm font-light leading-relaxed text-gray-300 sm:text-base">{body}</p>
      </div>
    </div>
  );
}

function TopographicBackdrop() {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 600 760"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <filter id="sportshub-auth-topo-displace" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="3" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="22" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <rect width="600" height="760" fill="#0a0a0a" />
      <g filter="url(#sportshub-auth-topo-displace)" fill="none" stroke="#ffffff">
        {TOPOGRAPHIC_RINGS.map((i) => (
          <ellipse
            key={i}
            cx="330"
            cy="250"
            rx={36 + i * 26}
            ry={24 + i * 18}
            strokeOpacity={i % 4 === 0 ? 0.18 : 0.08}
            strokeWidth={i % 4 === 0 ? 1.25 : 0.9}
            transform={`rotate(${i * 1.8} 330 250)`}
          />
        ))}
      </g>
    </svg>
  );
}
