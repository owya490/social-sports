"use client";

import { AnimatedSection } from "@/components/organiser/wrapped/AnimatedSection";
import { formatCurrency } from "@/services/src/wrapped/wrappedUtils";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface FeesSavedSectionProps {
  feesSavedVsEventbrite: number;
}

export function FeesSavedSection({ feesSavedVsEventbrite }: FeesSavedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      className="min-h-screen flex items-center justify-center px-6 py-20 bg-black relative overflow-hidden"
    >
      {/* Comparison visual */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background: "linear-gradient(135deg, #22c55e 0%, transparent 50%)",
          }}
        />
      </div>

      <AnimatedSection className="text-center relative z-10 max-w-3xl mx-auto">
        <div className="mb-8">
          <span className="inline-block px-4 py-2 bg-green-500/20 rounded-full text-green-400 text-sm font-medium uppercase tracking-wider">
            💰 Money Saved
          </span>
        </div>

        <h2 className="text-[clamp(1.5rem,4vw,2.5rem)] text-white/80 font-light mb-4">
          Compared to Eventbrite, you saved
        </h2>

        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.8, delay: 0.3, type: "spring", bounce: 0.4 }}
          className="text-[clamp(3.5rem,12vw,8rem)] font-black text-green-400 leading-none"
        >
          {formatCurrency(feesSavedVsEventbrite)}
        </motion.div>

        <p className="mt-8 text-gray-400 text-xl max-w-lg mx-auto">in platform fees this year</p>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="p-6 bg-white/5 rounded-2xl"
          >
            <p className="text-gray-400 text-sm uppercase tracking-wider mb-2">Eventbrite</p>
            <p className="text-2xl text-white/50 line-through">5.35% + $1.19</p>
            <p className="text-gray-500 text-sm mt-1">per ticket</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="p-6 bg-white/5 rounded-2xl"
          >
            <p className="text-gray-400 text-sm uppercase tracking-wider mb-2">Revolutionise SPORT</p>
            <p className="text-2xl text-white/50 line-through">2% + $1.60</p>
            <p className="text-gray-500 text-sm mt-1">per ticket</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="p-6 bg-white/5 rounded-2xl"
          >
            <p className="text-gray-400 text-sm uppercase tracking-wider mb-2">Humanitix</p>
            <p className="text-2xl text-white/50 line-through">4.9% + $0.99</p>
            <p className="text-gray-500 text-sm mt-1">per ticket</p>
          </motion.div>
        </div>
      </AnimatedSection>
    </section>
  );
}
