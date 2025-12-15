"use client";

import { AnimatedSection } from "@/components/organiser/wrapped/AnimatedSection";
import { CountUpNumber } from "@/components/organiser/wrapped/CountUpNumber";
import { formatNumber } from "@/services/src/wrapped/wrappedUtils";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface EventViewsSectionProps {
  totalEventViews: number;
}

export function EventViewsSection({ totalEventViews }: EventViewsSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  // Floating sparkle positions
  const sparkles = [
    { emoji: "✨", x: "8%", y: "15%", delay: 0, size: "text-4xl" },
    { emoji: "⭐", x: "92%", y: "20%", delay: 0.2, size: "text-5xl" },
    { emoji: "💫", x: "5%", y: "75%", delay: 0.4, size: "text-3xl" },
    { emoji: "🌟", x: "88%", y: "70%", delay: 0.3, size: "text-4xl" },
    { emoji: "✨", x: "15%", y: "45%", delay: 0.5, size: "text-2xl" },
    { emoji: "⭐", x: "85%", y: "40%", delay: 0.1, size: "text-3xl" },
  ];

  return (
    <section
      ref={ref}
      className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden"
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0 opacity-40"
          animate={{
            background: [
              "radial-gradient(circle at 30% 50%, #1a1a2e 0%, transparent 50%)",
              "radial-gradient(circle at 70% 50%, #16213e 0%, transparent 50%)",
              "radial-gradient(circle at 30% 50%, #1a1a2e 0%, transparent 50%)",
            ],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Floating sparkles */}
      {sparkles.map((sparkle, i) => (
        <motion.div
          key={i}
          className={`absolute ${sparkle.size} select-none pointer-events-none`}
          style={{ left: sparkle.x, top: sparkle.y }}
          initial={{ opacity: 0, scale: 0 }}
          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
          transition={{ delay: sparkle.delay + 0.5, duration: 0.5, ease: "backOut" }}
        >
          {sparkle.emoji}
        </motion.div>
      ))}

      <AnimatedSection className="text-center relative z-10">
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-cyan-400 text-xl font-bold uppercase tracking-[0.2em] mb-2"
        >
          Now that&apos;s a lot of views ✨
        </motion.p>
        <div className="flex items-center justify-center gap-3 mb-6">
          <motion.svg
            className="w-8 h-8 text-white/60"
            fill="currentColor"
            viewBox="0 0 24 24"
            initial={{ scale: 0 }}
            animate={isInView ? { scale: 1 } : { scale: 0 }}
            transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
          >
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
          </motion.svg>
          <span className="text-white/60 text-xl uppercase tracking-[0.2em]">Total Reach</span>
        </div>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0.5, opacity: 0 }}
          transition={{ delay: 0.4, duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="text-[clamp(4rem,15vw,10rem)] font-black text-white leading-none"
        >
          <CountUpNumber value={totalEventViews} />
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-6 text-[clamp(1.25rem,3vw,2rem)] text-white/70"
        >
          event page views
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-4 text-gray-400 text-lg max-w-md mx-auto"
        >
          Your events reached <span className="text-cyan-400 font-semibold">{formatNumber(totalEventViews)}</span>{" "}
          potential players
        </motion.p>
      </AnimatedSection>
    </section>
  );
}
