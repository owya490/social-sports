import Logo from "@/components/navbar/Logo";
import { ReactNode } from "react";

export const AUTH_INPUT_CLASS =
  "block w-full rounded-lg border-0 py-2.5 text-core-text shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black sm:leading-6";

export const AUTH_SUBMIT_CLASS =
  "flex w-full justify-center rounded-lg bg-core-text text-white px-3 py-2.5 font-semibold leading-6 border border-core-text hover:bg-white hover:text-core-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-core-text transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed";

interface AuthSplitLayoutProps {
  children: ReactNode;
  ctaTitle: string;
  ctaBody: string;
}

const TOPOGRAPHIC_RINGS = Array.from({ length: 16 }, (_, index) => index + 1);

export default function AuthSplitLayout({ children, ctaTitle, ctaBody }: AuthSplitLayoutProps) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-white md:grid md:grid-cols-2">
      <div className="relative flex flex-1 flex-col justify-center overflow-y-auto bg-white px-6 pb-10 pt-16 sm:px-12 sm:pt-20 md:min-h-screen md:pb-16 md:pt-24 lg:px-16 xl:px-24">
        <div className="absolute left-5 top-5 sm:left-6 sm:top-6">
          <Logo showText size="sm" />
        </div>
        <div className="mx-auto w-full max-w-sm">{children}</div>
      </div>
      <AuthCtaPanel title={ctaTitle} body={ctaBody} />
    </div>
  );
}

function AuthCtaPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="relative flex min-h-40 shrink-0 overflow-hidden bg-black text-white md:sticky md:top-0 md:h-screen md:min-h-screen">
      <TopographicBackdrop />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="relative z-10 mt-auto flex w-full flex-col justify-end p-6 sm:p-8 md:p-10 lg:p-12">
        <h2 className="max-w-md text-xl font-bold leading-tight tracking-tight sm:text-2xl md:text-3xl lg:text-4xl">
          {title}
        </h2>
        <p className="mt-2 max-w-md text-xs font-light leading-relaxed text-gray-300 sm:text-sm md:mt-4 md:text-sm lg:text-base">
          {body}
        </p>
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
      <rect width="600" height="760" fill="#000000" />
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
