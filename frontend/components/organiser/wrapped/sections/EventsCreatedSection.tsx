"use client";

import { AnimatedSection } from "@/components/organiser/wrapped/AnimatedSection";
import { SPORTS_CONFIG } from "@/config/SportsConfig";
import { motion, useInView } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";

interface EventsCreatedSectionProps {
  eventsCreated: number;
}

// Sport image component - just the image, no text
function SportImage({
  sport,
  index,
  isInView,
}: {
  sport: { name: string; defaultThumbnailUrl: string };
  index: number;
  isInView: boolean;
}) {
  const directions = [
    { x: -200, y: -100 },
    { x: 200, y: -100 },
    { x: -200, y: 100 },
    { x: 200, y: 100 },
  ];
  const direction = directions[index % 4];
  const rotations = [-12, 8, -6, 10];

  return (
    <motion.div
      initial={{ opacity: 0, x: direction.x, y: direction.y, scale: 0.5, rotate: rotations[index] - 20 }}
      animate={
        isInView
          ? { opacity: 1, x: 0, y: 0, scale: 1, rotate: rotations[index] }
          : { opacity: 0, x: direction.x, y: direction.y, scale: 0.5, rotate: rotations[index] - 20 }
      }
      transition={{
        duration: 0.7,
        delay: 0.3 + index * 0.12,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      className="w-28 h-28 md:w-36 md:h-36 lg:w-44 lg:h-44 rounded-2xl shadow-2xl overflow-hidden relative"
    >
      <Image src={sport.defaultThumbnailUrl} alt={sport.name} fill className="object-cover" />
    </motion.div>
  );
}

export function EventsCreatedSection({ eventsCreated }: EventsCreatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  // Get 4 sports for the images
  const sports = Object.values(SPORTS_CONFIG).slice(0, 4);

  // Image positions around the center text
  const imagePositions = [
    { left: "2%", top: "20%" },
    { right: "2%", top: "15%" },
    { left: "3%", bottom: "20%" },
    { right: "3%", bottom: "25%" },
  ];

  return (
    <section ref={ref} className="min-h-screen flex items-center justify-center px-6 bg-white relative overflow-hidden">
      {/* Subtle pattern background */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 40px,
              black 40px,
              black 41px
            )`,
          }}
        />
      </div>

      {/* Floating sport images - visible on all screen sizes */}
      {sports.map((sport, index) => (
        <div
          key={sport.value}
          className="absolute pointer-events-none"
          style={{
            left: imagePositions[index].left,
            right: imagePositions[index].right,
            top: imagePositions[index].top,
            bottom: imagePositions[index].bottom,
          }}
        >
          <SportImage sport={sport} index={index} isInView={isInView} />
        </div>
      ))}

      {/* Center content */}
      <AnimatedSection className="text-center relative z-10">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-gray-400 text-lg uppercase tracking-[0.2em] mb-4"
        >
          Events Created
        </motion.p>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="text-[clamp(5rem,18vw,12rem)] font-black text-black leading-none"
        >
          {eventsCreated}
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-6 text-[clamp(1.1rem,3vw,2rem)] text-gray-600 max-w-xl mx-auto leading-relaxed px-4"
        >
          You brought the community together
          <br />
          <span className="font-bold text-black">{eventsCreated} times</span> this year 🏆
        </motion.p>
      </AnimatedSection>
    </section>
  );
}
