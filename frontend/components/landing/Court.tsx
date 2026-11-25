import Image from "next/image";
import scroll from "./landingScroll.module.css";

export type CourtKind = "basketball" | "volleyball" | "badminton";
export type CourtTone = "charcoal" | "chalk" | "accent" | "hardwood";

// Surface and line colours per tone, kept to the SPORTSHUB palette.
const TONES: Record<CourtTone, { surface: string; line: string }> = {
  charcoal: { surface: "#161616", line: "rgba(255,255,255,0.78)" },
  chalk: { surface: "#ececec", line: "rgba(10,10,10,0.55)" },
  accent: { surface: "#f2b705", line: "rgba(10,10,10,0.7)" },
  hardwood: { surface: "#7a6040", line: "rgba(255,255,255,0.88)" },
};

// Court markings in metres, laid out top-down with the length running left to right.
const COURTS: Record<CourtKind, { width: number; height: number; paths: string[] }> = {
  basketball: {
    width: 28,
    height: 15,
    paths: [
      "M0 0 H28 V15 H0 Z",
      "M14 0 V15",
      "M14 5.7 a1.8 1.8 0 1 1 0 3.6 a1.8 1.8 0 1 1 0 -3.6",
      "M0 5.05 H5.8 V9.95 H0",
      "M28 5.05 H22.2 V9.95 H28",
      "M0 0.9 H2.99 A6.75 6.75 0 0 1 2.99 14.1 H0",
      "M28 0.9 H25.01 A6.75 6.75 0 0 0 25.01 14.1 H28",
    ],
  },
  volleyball: {
    width: 18,
    height: 9,
    paths: ["M0 0 H18 V9 H0 Z", "M9 -0.6 V9.6", "M6 0 V9", "M12 0 V9"],
  },
  badminton: {
    width: 13.4,
    height: 6.1,
    paths: [
      "M0 0 H13.4 V6.1 H0 Z",
      "M0 0.46 H13.4",
      "M0 5.64 H13.4",
      "M6.7 -0.4 V6.5",
      "M4.72 0 V6.1",
      "M8.68 0 V6.1",
      "M0.76 0 V6.1",
      "M12.64 0 V6.1",
      "M0 3.05 H4.72",
      "M8.68 3.05 H13.4",
    ],
  },
};

/**
 * A top-down court drawn to scale. Lines draw themselves in on load or as the court scrolls into view,
 * and the surface fills its container so the court can sit behind product screens.
 */
export default function Court({
  kind,
  tone,
  drawOn = "scroll",
  portrait = false,
  className = "",
  surface,
  surfaceSizes,
  priority = false,
  keyFill,
  alignX = "Mid",
  lineScale = 1,
}: {
  kind: CourtKind;
  tone: CourtTone;
  drawOn?: "load" | "scroll";
  portrait?: boolean;
  className?: string;
  /** Generated floor texture drawn under the markings. Without it the tone's flat colour is used. */
  surface?: { src: string; shade: string; objectPosition?: string; filter?: string };
  surfaceSizes?: string;
  priority?: boolean;
  /** Paints the free-throw lanes, as on a coloured-key court. Basketball only. */
  keyFill?: string;
  /** Which end of a landscape court stays in view when the container is narrower than the court. */
  alignX?: "Min" | "Mid" | "Max";
  /** Multiplies the marking width so lines stay legible when the court is cropped small. */
  lineScale?: number;
}) {
  const court = COURTS[kind];
  const colours = TONES[tone];
  const margin = court.width * 0.12;
  const lineClass = drawOn === "load" ? scroll.drawOnLoad : scroll.drawLine;
  const viewWidth = (portrait ? court.height : court.width) + margin * 2;
  const viewHeight = (portrait ? court.width : court.height) + margin * 2;

  return (
    <div aria-hidden className={`absolute inset-0 ${className}`} style={{ background: colours.surface }}>
      {surface && (
        <>
          <Image
            src={surface.src}
            alt=""
            fill
            priority={priority}
            sizes={surfaceSizes ?? "100vw"}
            className="object-cover"
            style={{ objectPosition: surface.objectPosition, filter: surface.filter }}
          />
          <div className="absolute inset-0" style={{ background: surface.shade }} />
        </>
      )}
      <svg
        viewBox={`${-margin} ${-margin} ${viewWidth} ${viewHeight}`}
        preserveAspectRatio={portrait ? "xMidYMin slice" : `x${alignX}YMid slice`}
        className="h-full w-full"
        fill="none"
        stroke={colours.line}
        strokeWidth={(court.width / 220) * lineScale}
        strokeLinecap="round"
        style={surface ? { filter: "url(#court-paint)" } : undefined}
      >
        {surface && (
          <defs>
            {/* Roughens the edges and thins the paint in patches so the lines read as worn paint on boards. */}
            <filter id="court-paint" x="-5%" y="-5%" width="110%" height="110%">
              <feTurbulence type="fractalNoise" baseFrequency="2.2" numOctaves="2" seed="7" result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale="0.07" result="d" />
              <feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -2.2 2.1" result="m" />
              <feComposite in="d" in2="m" operator="in" />
            </filter>
          </defs>
        )}
        <g transform={portrait ? `translate(${court.height} 0) rotate(90)` : undefined}>
          {keyFill && kind === "basketball" && (
            <>
              <path d="M0 5.05 H5.8 V9.95 H0 Z" fill={keyFill} stroke="none" />
              <path d="M28 5.05 H22.2 V9.95 H28 Z" fill={keyFill} stroke="none" />
            </>
          )}
          {court.paths.map((path) => (
            <path key={path} d={path} pathLength={1} className={lineClass} />
          ))}
        </g>
      </svg>
    </div>
  );
}
