"use client";

import { type CSSProperties, useEffect, useId, useRef } from "react";

const ARC_PATHS = [
  "M 232.804688 392.75 C 232.355469 381.617188 238.59375 372.328125 245.941406 364.667969 C 252.664062 356.898438 260.261719 349.921875 268.054688 343.234375 C 309.933594 308.371094 364.597656 292.105469 418.71875 298.054688 C 508.808594 307.441406 584.113281 380.992188 593.207031 471.394531 C 594.410156 486.300781 573.132812 489.390625 570.121094 474.699219 C 550.296875 366.710938 436.089844 302.347656 334.496094 344.984375 C 311.175781 354.816406 289.957031 369.820312 273.339844 388.941406 C 267.238281 396.035156 262.378906 402.371094 252.390625 405.421875 C 243.433594 408.957031 233.113281 402.46875 232.804688 392.75 Z M 232.804688 392.75 ",
  "M 583.78125 581.773438 C 547.113281 679.367188 443.824219 735.683594 342.191406 708.183594 C 317.785156 701.597656 294.695312 689.878906 274.71875 674.371094 C 267.898438 669.144531 260.515625 663.625 258.804688 654.570312 C 256.878906 644.890625 265.722656 636.285156 275.324219 638.109375 C 283.777344 639.0625 288.34375 644.484375 294.386719 649.128906 C 345.515625 689.703125 418.039062 698.175781 476.898438 669.535156 C 501.230469 657.5625 523.132812 639.414062 539.105469 617.433594 C 543.320312 611.71875 547.304688 605.132812 550.84375 598.972656 C 552.496094 596.039062 554.164062 592.152344 555.679688 589.160156 C 555.679688 589.160156 556.867188 586.691406 556.867188 586.691406 C 557.253906 585.855469 557.546875 585 557.878906 584.144531 C 557.878906 584.144531 561.800781 573.941406 561.800781 573.941406 C 567.1875 558.707031 589.300781 566.460938 583.761719 581.792969 Z M 583.78125 581.773438 ",
] as const;

const FEATHER = 6;

// Faint copies of each mask stroke reach `spread` path units past the solid
// window, so a moving ring fades out over ~20 units instead of cutting off. The
// opacities composite to roughly a linear ramp; the feather blur smooths the
// steps. At rest the extra reach lies outside the swoosh, keeping it crisp.
// globals.css starts the entry slide far enough back to hide the widest layer.
const FADE_LAYERS = [
  { spread: 0, opacity: 1 },
  { spread: 4, opacity: 0.67 },
  { spread: 8, opacity: 0.4 },
  { spread: 12, opacity: 0.29 },
  { spread: 16, opacity: 0.22 },
  { spread: 20, opacity: 0.1 },
] as const;

// Each swoosh is revealed through a mask stroked along its centre line (`flow`,
// drawn tail to head, left to right), so animating the dash slides the exact
// logo shape along its own track. globals.css staggers them by position.
// Mask widths leave room for the feather blur outside each swoosh.
const SWOOSHES = [
  {
    d: "M 373.226562 629.753906 C 366.5 630.238281 359.992188 629.890625 353.308594 630.125 C 346.816406 630.027344 341.121094 626.625 335.078125 624.722656 C 331.113281 623.261719 327.148438 621.746094 323.226562 620.191406 C 275.886719 601.480469 229.441406 578.683594 189.585938 546.601562 C 178.644531 537.332031 190.324219 520.484375 202.820312 527.441406 C 230.414062 544.25 259.835938 557.714844 289.917969 569.53125 C 308.707031 576.933594 327.832031 583.601562 347.109375 589.703125 C 352.800781 591.878906 359.117188 592.421875 364.207031 596.019531 C 369.359375 600.175781 374.878906 603.34375 380.085938 607.582031 C 388.945312 614.558594 384.359375 629.035156 373.226562 629.753906 Z M 373.226562 629.753906 ",
    flow: "M 129.8 577.4 L 187.8 531.7 L 191.5 530.2 L 196.5 533.1 L 204.6 541.6 L 213.0 548.1 L 220.7 552.8 L 228.6 557.5 L 236.6 562.0 L 244.6 566.3 L 252.7 570.4 L 260.8 574.5 L 268.9 578.3 L 277.1 582.0 L 285.4 585.7 L 293.8 589.2 L 302.2 592.7 L 310.6 596.0 L 319.0 599.2 L 327.3 602.3 L 336.1 605.4 L 345.7 608.5 L 361.9 609.9 L 375.3 610.0 L 378.9 612.5 L 382.2 615.3 L 383.9 619.1 L 396.1 691.9 L 396.1 691.9",
    flowWidth: 71.9,
  },
  {
    d: "M 492.699219 588.109375 C 487.628906 590.363281 482.632812 591.335938 477.367188 592.851562 C 474.800781 593.589844 472.160156 594.582031 469.652344 594.929688 C 467.144531 595.300781 464.753906 594.988281 462.441406 594.386719 C 453.132812 592.210938 443.882812 589.859375 434.691406 587.351562 C 416.308594 582.335938 398.15625 576.703125 380.222656 570.503906 C 308.515625 544.96875 206.375 499.785156 159.464844 437.660156 C 143.257812 415.058594 139.3125 389.777344 161.191406 369.160156 C 170.441406 360.648438 184.007812 356.722656 196.09375 357.847656 C 202.527344 358.316406 207.347656 363.910156 206.878906 370.324219 C 206.453125 376.308594 201.554688 380.914062 195.6875 381.128906 C 189.175781 381.246094 183.464844 383.304688 179.304688 387.988281 C 176.757812 390.902344 174.660156 394.808594 174.214844 398.753906 C 174.175781 401.941406 175.242188 404.953125 176.546875 407.90625 C 182.511719 419.355469 191.664062 427.730469 201.75 436.28125 C 229.148438 458.570312 260.882812 475.183594 292.988281 490.03125 C 350.238281 515.917969 410.886719 535.542969 472.488281 548.15625 C 479.933594 549.070312 484.691406 556.085938 490.738281 559.949219 C 492.816406 561.601562 494.933594 563.351562 496.953125 565.371094 C 503.988281 572.039062 501.617188 584.457031 492.699219 588.109375 Z M 492.699219 588.109375 ",
    flow: "M 84.6 444.0 L 155.2 377.1 L 163.0 371.9 L 172.2 370.7 L 177.3 375.6 L 172.7 381.4 L 164.7 388.6 L 164.6 410.3 L 176.1 432.8 L 190.9 448.1 L 206.8 461.3 L 223.4 473.2 L 240.7 484.2 L 258.2 494.3 L 276.1 503.7 L 294.3 512.6 L 312.4 520.7 L 330.6 528.4 L 349.0 535.7 L 367.6 542.5 L 386.3 549.0 L 405.8 555.1 L 425.3 560.7 L 444.4 565.8 L 474.0 566.7 L 492.6 569.2 L 498.4 576.3 L 541.7 663.1 L 541.7 663.1",
    flowWidth: 91.2,
  },
  {
    d: "M 339.394531 434.335938 C 343.300781 432.179688 348.234375 433.832031 352.179688 434.53125 C 363.917969 436.28125 374.957031 439.488281 385.546875 444.773438 C 399.617188 450.953125 413.820312 456.820312 428.183594 462.242188 C 477.773438 480.644531 529.351562 496.773438 582.246094 500.71875 C 596.644531 501.398438 629.757812 502.390625 635.804688 487.855469 C 639.28125 479.089844 637.046875 470.441406 629.644531 463.621094 C 619.382812 453.207031 633.101562 437.425781 644.820312 445.957031 C 664.503906 460.125 670.082031 487.777344 656.578125 508.21875 C 620.375 557.988281 487.453125 524.484375 437.082031 508.824219 C 413.996094 501.574219 391.238281 493.238281 368.832031 484.125 C 357.15625 479.945312 346.875 473.570312 337.585938 465.3125 C 337.585938 465.3125 332.804688 461.347656 332.804688 461.347656 C 332.007812 460.667969 331.289062 459.890625 330.667969 458.878906 C 325.578125 450.136719 330.53125 438.125 339.414062 434.316406 Z M 339.394531 434.335938 ",
    flow: "M 264.8 508.4 L 331.5 444.9 L 338.3 442.0 L 350.8 448.4 L 370.9 461.5 L 387.9 468.9 L 403.7 475.1 L 420.1 481.3 L 436.4 487.0 L 452.9 492.4 L 469.7 497.5 L 486.2 502.0 L 503.2 506.2 L 520.1 509.9 L 537.5 513.0 L 555.2 515.4 L 573.0 516.9 L 591.3 517.3 L 610.1 515.6 L 629.6 509.7 L 646.0 493.7 L 648.7 481.1 L 646.0 473.7 L 649.4 468.6 L 656.2 470.6 L 661.1 477.2 L 663.3 485.2 L 674.8 576.6 L 674.8 576.6",
    flowWidth: 88.5,
  },
] as const;

export type SportshubMarkAnimation = "intro" | "loading" | "none";

/**
 * Inline SPORTSHUB mark whose rings appear to spin around the globe.
 * Hover motion plays when an ancestor has the `sportshub-mark-trigger` class.
 */
export function SportshubMark({
  animation = "intro",
  className = "",
  label,
}: {
  animation?: SportshubMarkAnimation;
  className?: string;
  label?: string;
}) {
  const id = useId();
  const svgRef = useRef<SVGSVGElement>(null);

  // CSS :hover would cut a lap short and snap the rings back when the pointer
  // leaves, so a hover starts a lap that always runs to completion.
  useEffect(() => {
    const svg = svgRef.current;
    const trigger = svg?.closest(".sportshub-mark-trigger");
    if (!svg || !trigger) {
      return;
    }

    let playing = false;
    const playLap = () => {
      if (playing) {
        return;
      }
      playing = true;
      svg.setAttribute("data-lap", "");
      const laps = svg
        .getAnimations({ subtree: true })
        .filter((lap) => lap.effect?.getTiming().iterations !== Infinity)
        .map((lap) => lap.finished);
      void Promise.allSettled(laps).then(() => {
        svg.removeAttribute("data-lap");
        playing = false;
      });
    };

    trigger.addEventListener("pointerenter", playLap);
    trigger.addEventListener("focusin", playLap);
    return () => {
      trigger.removeEventListener("pointerenter", playLap);
      trigger.removeEventListener("focusin", playLap);
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="146.03 296.85 517.95 418.3"
      fill="currentColor"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-animation={animation}
      className={`sportshub-mark ${className}`}
    >
      <defs>
        <filter id={`${id}-feather`} filterUnits="userSpaceOnUse" x="60" y="200" width="700" height="620">
          <feGaussianBlur stdDeviation={FEATHER} />
        </filter>
        {SWOOSHES.map(({ flow, flowWidth }, index) => (
          <mask key={flow} id={`${id}-${index}`}>
            <g filter={`url(#${id}-feather)`}>
              {FADE_LAYERS.map(({ spread, opacity }) => (
                <path
                  key={spread}
                  className="sportshub-mark-flow"
                  d={flow}
                  pathLength={100}
                  strokeWidth={flowWidth}
                  strokeOpacity={opacity}
                  style={{ "--sportshub-mark-flow-spread": `${spread}px` } as CSSProperties}
                />
              ))}
            </g>
          </mask>
        ))}
      </defs>
      <g className="sportshub-mark-globe">
        <g className="sportshub-mark-globe-motion">
          {ARC_PATHS.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
      </g>
      {SWOOSHES.map(({ d }, index) => (
        <path key={d} d={d} mask={`url(#${id}-${index})`} />
      ))}
    </svg>
  );
}
