"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function BackButton() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="fixed top-4 left-4 md:top-6 md:left-6 z-50"
    >
      <Link
        href="/organiser/dashboard"
        className="flex items-center gap-1.5 p-2 md:px-3 md:py-1.5 rounded-full text-black/60 hover:text-black bg-white/50 hover:bg-white/80 backdrop-blur-sm transition-all duration-200 group text-xs"
      >
        <svg
          className="w-4 h-4 transition-transform group-hover:-translate-x-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="hidden md:inline font-medium">Back</span>
      </Link>
    </motion.div>
  );
}
