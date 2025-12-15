"use client";

import { AnimatedSection } from "@/components/organiser/wrapped/AnimatedSection";
import { EventId } from "@/interfaces/EventTypes";
import { formatCurrency } from "@/services/src/wrapped/wrappedUtils";
import { motion, useInView } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

interface MostPopularEventSectionProps {
  mostPopularEvent: {
    eventId: EventId;
    name: string;
    eventImage: string;
    attendance: number;
    revenue: number;
  };
}

export function MostPopularEventSection({ mostPopularEvent }: MostPopularEventSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      className="min-h-screen flex items-center justify-center px-6 py-20 relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #000 0%, #1a1a1a 100%)",
      }}
    >
      {/* Star burst effect */}
      <div className="absolute inset-0">
        {isInView && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.15, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]"
            style={{
              background: "radial-gradient(circle, #fbbf24 0%, transparent 70%)",
            }}
          />
        )}
      </div>

      <AnimatedSection className="text-center relative z-10 max-w-4xl mx-auto">
        <div className="mb-6">
          <span className="inline-block px-4 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full text-white text-sm font-bold uppercase tracking-wider shadow-lg">
            🔥 Your Biggest Hit 🔥
          </span>
        </div>

        {/* Event Image with glow effect */}
        {mostPopularEvent.eventImage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
            animate={isInView ? { opacity: 1, scale: 1, rotateY: 0 } : { opacity: 0, scale: 0.8, rotateY: -15 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative mx-auto mb-8 max-w-md"
          >
            {/* Glow effect behind image */}
            <div
              className="absolute inset-0 rounded-2xl opacity-50"
              style={{
                background: "linear-gradient(135deg, #f97316, #eab308)",
                filter: "blur(30px)",
                transform: "scale(1.1)",
              }}
            />
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20">
              <div className="aspect-video relative">
                <Image src={mostPopularEvent.eventImage} alt={mostPopularEvent.name} fill className="object-cover" />
              </div>
            </div>
          </motion.div>
        )}

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-[clamp(1.5rem,5vw,3rem)] font-black text-white leading-tight"
        >
          {mostPopularEvent.name}
        </motion.h2>

        {/* Check it out button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-6"
        >
          <Link
            href={`/event/${mostPopularEvent.eventId}`}
            target="_blank"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors"
          >
            Check it out
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </motion.div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="text-center"
          >
            <p className="text-5xl sm:text-6xl font-black text-white">{mostPopularEvent.attendance}</p>
            <p className="mt-2 text-gray-400 text-lg">views</p>
          </motion.div>

          <div className="hidden sm:block w-px h-20 bg-white/20" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="text-center"
          >
            <p className="text-5xl sm:text-6xl font-black text-white">{formatCurrency(mostPopularEvent.revenue)}</p>
            <p className="mt-2 text-gray-400 text-lg">revenue</p>
          </motion.div>
        </div>
      </AnimatedSection>
    </section>
  );
}
