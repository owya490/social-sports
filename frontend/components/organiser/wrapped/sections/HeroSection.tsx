"use client";

import { formatDate } from "@/services/src/wrapped/wrappedUtils";
import { motion } from "framer-motion";
import Image from "next/image";

interface HeroSectionProps {
  organiserName: string;
  year: number;
  dateRange: {
    from: string;
    to: string;
  };
}

// Floating emoji component for fun background elements
function FloatingEmoji({
  emoji,
  delay,
  duration,
  x,
  y,
}: {
  emoji: string;
  delay: number;
  duration: number;
  x: string;
  y: string;
}) {
  return (
    <motion.div
      className="absolute text-4xl md:text-6xl select-none pointer-events-none"
      style={{ left: x, top: y }}
      initial={{ opacity: 0, scale: 0, rotate: -20 }}
      animate={{
        opacity: [0, 1, 1, 0],
        scale: [0.5, 1.2, 1, 0.8],
        rotate: [-20, 10, -5, 15],
        y: [0, -20, 0, -10, 0],
      }}
      transition={{
        delay,
        duration,
        repeat: Infinity,
        repeatDelay: 1,
        ease: "easeInOut",
      }}
    >
      {emoji}
    </motion.div>
  );
}

export function HeroSection({ organiserName, year, dateRange }: HeroSectionProps) {
  const emojis = [
    { emoji: "⚽", delay: 0, duration: 4, x: "10%", y: "20%" },
    { emoji: "🏀", delay: 0.5, duration: 4.5, x: "85%", y: "15%" },
    { emoji: "🎾", delay: 1, duration: 3.5, x: "10%", y: "70%" },
    { emoji: "🏐", delay: 1.5, duration: 4, x: "80%", y: "65%" },
    { emoji: "🏆", delay: 0.3, duration: 5, x: "5%", y: "45%" },
    { emoji: "⭐", delay: 0.8, duration: 3, x: "90%", y: "40%" },
    { emoji: "🎯", delay: 1.2, duration: 4.2, x: "25%", y: "85%" },
    { emoji: "🔥", delay: 0.7, duration: 3.8, x: "70%", y: "80%" },
  ];

  return (
    <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-6 bg-white">
      {/* Animated background patterns - no blur for performance */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Subtle gradient circles */}
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-br from-orange-100 to-yellow-50 opacity-60"
          style={{ left: "-10%", top: "-20%" }}
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 30, 0],
            y: [0, 20, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-br from-blue-50 to-purple-50 opacity-50"
          style={{ right: "-10%", bottom: "-10%" }}
          animate={{
            scale: [1, 1.15, 1],
            x: [0, -20, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Floating emojis */}
      {emojis.map((props, i) => (
        <FloatingEmoji key={i} {...props} />
      ))}

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 text-center"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.1, duration: 0.8, type: "spring", stiffness: 200 }}
          className="mb-6 flex justify-center"
        >
          <Image src="/images/logo.png" alt="SportHub Logo" width={120} height={120} className="drop-shadow-lg" />
        </motion.div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mb-6"
        >
          <motion.span
            className="inline-block px-5 py-2.5 bg-black text-white text-sm font-bold tracking-wider uppercase rounded-full shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ✨ Your Year in Review ✨
          </motion.span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-[clamp(2.5rem,8vw,6rem)] font-black text-black leading-none tracking-tight"
        >
          <motion.span
            className="inline-block"
            animate={{ rotate: [0, -2, 2, 0] }}
            transition={{ delay: 1.5, duration: 0.5, repeat: Infinity, repeatDelay: 5 }}
          >
            SPORTSHUB
          </motion.span>
          <br />
          <span className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
            Wrapped {year}
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-8 text-[clamp(1.25rem,3vw,2rem)] text-gray-700 font-light"
        >
          <motion.span
            className="font-bold text-black"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ delay: 1.2, duration: 0.4, repeat: Infinity, repeatDelay: 3 }}
          >
            {organiserName}
          </motion.span>
          , here&apos;s your impact 🚀
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="mt-6 text-gray-500 text-lg font-medium"
        >
          {formatDate(dateRange.from)} → {formatDate(dateRange.to)}
        </motion.div>

        {/* Fun confetti burst on load */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ delay: 2, duration: 1 }}
        >
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full"
              style={{
                left: "50%",
                top: "50%",
                backgroundColor: ["#FF6B6B", "#4ECDC4", "#FFE66D", "#95E1D3", "#F38181", "#AA96DA"][i % 6],
              }}
              initial={{ x: 0, y: 0, scale: 0 }}
              animate={{
                x: Math.cos((i * 30 * Math.PI) / 180) * 150,
                y: Math.sin((i * 30 * Math.PI) / 180) * 150,
                scale: [0, 1.5, 0],
                opacity: [0, 1, 0],
              }}
              transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
            />
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.6 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-gray-400 text-sm font-medium">Scroll to explore</span>
          <motion.div
            className="w-8 h-8 rounded-full bg-black flex items-center justify-center"
            whileHover={{ scale: 1.1 }}
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
