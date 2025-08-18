"use client";

import React, { useRef } from "react";

type Card = {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
};

const cards: Card[] = [
  {
    title: "Simple yet powerful",
    description: "Clean, intuitive user experience, yet a feature rich platform, ready to power your events.",
    imageSrc: "/images/organiser/31.png",
    imageAlt: "Feature visual",
  },
  {
    title: "Designed to move fast",
    description: "Lightning‑quick flows for publishing events and collecting payments.",
    imageSrc: "/images/organiser/30.png",
    imageAlt: "Speed visual",
  },
  {
    title: "Secure and private",
    description: "Privacy‑first design, secure payments and protected participant data.",
    imageSrc: "/images/organiser/29.png",
    imageAlt: "Security visual",
  },
];

export default function FeatureTilesCarousel(): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const startScrollLeftRef = useRef<number>(0);

  const startDrag = (clientX: number): void => {
    const container = containerRef.current;
    if (!container) return;
    isDraggingRef.current = true;
    startXRef.current = clientX;
    startScrollLeftRef.current = container.scrollLeft;
  };

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => startDrag(e.clientX);
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>): void => {
    const container = containerRef.current;
    if (!container || !isDraggingRef.current) return;
    e.preventDefault();
    container.scrollLeft = startScrollLeftRef.current - (e.clientX - startXRef.current);
  };
  const endDrag = (): void => {
    isDraggingRef.current = false;
  };

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>): void => startDrag(e.touches[0].clientX);
  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>): void => {
    const container = containerRef.current;
    if (!container || !isDraggingRef.current) return;
    container.scrollLeft = startScrollLeftRef.current - (e.touches[0].clientX - startXRef.current);
  };
  const onTouchEnd = (): void => endDrag();

  return (
    <div
      ref={containerRef}
      className="no-scrollbar flex gap-3 overflow-x-auto snap-x snap-mandatory -mx-6 px-6"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      aria-label="Feature tiles carousel"
      role="region"
    >
      {cards.map((card) => (
        <article
          key={card.title}
          className="snap-center shrink-0 group relative rounded-xl overflow-hidden border border-core-outline bg-white p-3 shadow-sm w-[220px] sm:w-[260px]"
        >
          <div className="relative">
            <div className="flex items-center justify-center">
              <img src={card.imageSrc} alt={card.imageAlt} className="w-1/2 aspect-square object-cover rounded-lg" />
            </div>
            <h4 className="mt-2 text-sm font-semibold">{card.title}</h4>
            <p className="text-gray-600 text-[11px] mt-1 leading-snug">{card.description}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
