"use client";

type BatteryIllustrationProps = {
  className?: string;
};

export default function BatteryIllustration({ className }: BatteryIllustrationProps): JSX.Element {
  // Geometry for a minimal top-down 3D look
  const topX = 120;
  const topY = 120;
  const width = 360;
  const height = 160;
  const radius = 6;
  const dx = 14; // horizontal depth offset
  const dy = 18; // vertical depth offset

  const baseX = topX + dx;
  const baseY = topY + dy;

  // Tip geometry
  const tipWidth = 18;
  const tipHeight = 72;
  const tipRadius = 4;
  const tipTopX = topX + width + 6;
  const tipTopY = topY + Math.round((height - tipHeight) / 2);
  const tipBaseX = tipTopX + dx;
  const tipBaseY = tipTopY + dy;

  return (
    <svg viewBox="0 0 640 400" role="img" aria-label="Minimal battery illustration" className={className}>
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* Removed percentage label */}

        {/* Base face (offset), drawn lighter to read as depth */}
        <rect x={baseX} y={baseY} width={width} height={height} rx={radius} stroke="#D1D5DB" strokeWidth={2} />

        {/* Connectors between faces */}
        <g stroke="#CBD5E1" strokeWidth={2}>
          <line x1={topX} y1={topY} x2={baseX} y2={baseY} />
          <line x1={topX + width} y1={topY} x2={baseX + width} y2={baseY} />
          <line x1={topX} y1={topY + height} x2={baseX} y2={baseY + height} />
          <line x1={topX + width} y1={topY + height} x2={baseX + width} y2={baseY + height} />
        </g>

        {/* Top face outline (crisp) */}
        <g stroke="#9CA3AF" strokeWidth={2.25}>
          <rect x={topX} y={topY} width={width} height={height} rx={radius} />
          {/* Inner rim on top face for architectural detail */}
          <rect
            x={topX + 12}
            y={topY + 12}
            width={width - 24}
            height={height - 24}
            rx={Math.max(0, radius - 2)}
            opacity={0.6}
          />
        </g>

        {/* Tip in perspective */}
        <g>
          {/* Base tip (lighter) */}
          <rect
            x={tipBaseX}
            y={tipBaseY}
            width={tipWidth}
            height={tipHeight}
            rx={tipRadius}
            stroke="#D1D5DB"
            strokeWidth={2}
          />
          {/* Connectors for tip */}
          <g stroke="#CBD5E1" strokeWidth={2}>
            <line x1={tipTopX} y1={tipTopY} x2={tipBaseX} y2={tipBaseY} />
            <line x1={tipTopX + tipWidth} y1={tipTopY} x2={tipBaseX + tipWidth} y2={tipBaseY} />
            <line x1={tipTopX} y1={tipTopY + tipHeight} x2={tipBaseX} y2={tipBaseY + tipHeight} />
            <line x1={tipTopX + tipWidth} y1={tipTopY + tipHeight} x2={tipBaseX + tipWidth} y2={tipBaseY + tipHeight} />
          </g>
          {/* Top tip */}
          <rect
            x={tipTopX}
            y={tipTopY}
            width={tipWidth}
            height={tipHeight}
            rx={tipRadius}
            stroke="#9CA3AF"
            strokeWidth={2.25}
          />
        </g>
      </g>
    </svg>
  );
}
