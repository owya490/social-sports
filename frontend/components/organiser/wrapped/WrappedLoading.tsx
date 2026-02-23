"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

const loadingPhrases = [
  { text: "Spiking the volleyball... 🏐", emoji: "🏐" },
  { text: "Scoring the winning goal... ⚽", emoji: "⚽" },
  { text: "Making a slam dunk... 🏀", emoji: "🏀" },
  { text: "Serving up your stats... 🎾", emoji: "🎾" },
  { text: "Warming up on the bench... 🏆", emoji: "🏆" },
  { text: "Unwrapping your presents... 🎁", emoji: "🎁" },
  { text: "Decking the halls with stats... 🎄", emoji: "🎄" },
  { text: "Checking Santa's list twice... 🎅", emoji: "🎅" },
  { text: "Tallying up your victories... ✨", emoji: "✨" },
  { text: "Crunching the numbers... 📊", emoji: "📊" },
];

export function WrappedLoading() {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % loadingPhrases.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex flex-col items-center justify-center px-6 -mt-[var(--navbar-height)]">
      {/* Main content */}
      <div className="relative z-10 text-center">
        {/* Spinning logo with orbiting circles */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          {/* Outer spinning ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-white/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />

          {/* Middle spinning ring with gradient */}
          <motion.div
            className="absolute inset-2 rounded-full border-2 border-transparent"
            style={{
              borderTopColor: "rgba(249, 115, 22, 0.8)",
              borderRightColor: "rgba(249, 115, 22, 0.4)",
            }}
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />

          {/* Inner spinning ring */}
          <motion.div
            className="absolute inset-4 rounded-full border-2 border-transparent"
            style={{
              borderTopColor: "rgba(255, 255, 255, 0.8)",
              borderLeftColor: "rgba(255, 255, 255, 0.3)",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />

          {/* Orbiting dots */}
          <motion.div
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-2 h-2 bg-orange-500 rounded-full shadow-lg shadow-orange-500/50" />
          </motion.div>

          <motion.div
            className="absolute inset-0"
            animate={{ rotate: -360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 w-2 h-2 bg-white rounded-full shadow-lg shadow-white/50" />
          </motion.div>

          {/* Center logo with pulse */}
          <motion.div
            className="absolute inset-6 flex items-center justify-center"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src="/icons/Icon_white.svg"
              alt="SportHub"
              width={56}
              height={56}
              className="drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]"
            />
          </motion.div>
        </div>

        {/* Animated phrase */}
        <div className="h-16 flex items-center justify-center">
          <AnimatePresence>
            <motion.div
              key={phraseIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="text-white text-xl font-medium"
            >
              {loadingPhrases[phraseIndex].text}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-gray-400 text-sm mt-4"
        >
          Preparing your year in review...
        </motion.p>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-8">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-white rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom decoration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 text-center"
      >
        <p className="text-gray-500 text-xs">SPORTSHUB WRAPPED 2025</p>
      </motion.div>
    </div>
  );
}
