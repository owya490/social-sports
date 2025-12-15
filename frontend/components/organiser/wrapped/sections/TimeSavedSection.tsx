"use client";

import { AnimatedSection } from "@/components/organiser/wrapped/AnimatedSection";
import { formatMinutesToTime } from "@/services/src/wrapped/wrappedUtils";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface TimeSavedSectionProps {
  minutesSavedBookkeeping: number;
}

export function TimeSavedSection({ minutesSavedBookkeeping }: TimeSavedSectionProps) {
  const hours = Math.floor(minutesSavedBookkeeping / 60);
  const isLessThanHour = minutesSavedBookkeeping < 60;
  const displayValue = isLessThanHour ? minutesSavedBookkeeping : hours;
  const displayUnit = isLessThanHour ? "minutes" : "hours";
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-white via-blue-50 to-indigo-50 relative overflow-hidden"
    >
      {/* Animated Clock-inspired background */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.svg
          className="w-[500px] h-[500px] md:w-[700px] md:h-[700px] opacity-10"
          viewBox="0 0 100 100"
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
        >
          {/* Outer circle */}
          <circle
            cx="50"
            cy="50"
            r="48"
            stroke="currentColor"
            strokeWidth="0.5"
            fill="none"
            className="text-indigo-400"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
            className="text-indigo-500"
          />

          {/* Hour markers */}
          {[...Array(12)].map((_, i) => (
            <g key={i} transform={`rotate(${i * 30} 50 50)`}>
              <line x1="50" y1="7" x2="50" y2="12" stroke="currentColor" strokeWidth="2" className="text-indigo-600" />
              <circle cx="50" cy="9" r="1.5" fill="currentColor" className="text-indigo-400" />
            </g>
          ))}

          {/* Minute markers */}
          {[...Array(60)].map(
            (_, i) =>
              i % 5 !== 0 && (
                <line
                  key={`min-${i}`}
                  x1="50"
                  y1="8"
                  x2="50"
                  y2="10"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  className="text-indigo-300"
                  transform={`rotate(${i * 6} 50 50)`}
                />
              )
          )}

          {/* Center dot */}
          <circle cx="50" cy="50" r="3" fill="currentColor" className="text-indigo-500" />
        </motion.svg>

        {/* Hour hand - slowest rotation */}
        <motion.div
          className="absolute w-1 h-20 md:h-28 bg-indigo-400 rounded-full origin-bottom opacity-20"
          style={{ bottom: "50%", left: "calc(50% - 2px)" }}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
        />

        {/* Minute hand - medium rotation */}
        <motion.div
          className="absolute w-0.5 h-28 md:h-36 bg-indigo-300 rounded-full origin-bottom opacity-20"
          style={{ bottom: "50%", left: "calc(50% - 1px)" }}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        />

        {/* Second hand - faster rotation */}
        <motion.div
          className="absolute w-0.5 h-32 md:h-40 bg-red-400 rounded-full origin-bottom opacity-30"
          style={{ bottom: "50%", left: "calc(50% - 1px)" }}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Floating time elements */}
      <motion.div
        className="absolute top-[15%] left-[10%] text-4xl opacity-20 select-none"
        animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        ⏰
      </motion.div>
      <motion.div
        className="absolute top-[20%] right-[15%] text-3xl opacity-20 select-none"
        animate={{ y: [0, -15, 0], rotate: [0, -5, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        ⌛
      </motion.div>
      <motion.div
        className="absolute bottom-[20%] left-[15%] text-3xl opacity-20 select-none"
        animate={{ y: [0, -12, 0], rotate: [0, -3, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      >
        🕐
      </motion.div>
      <motion.div
        className="absolute bottom-[25%] right-[10%] text-4xl opacity-20 select-none"
        animate={{ y: [0, -8, 0], rotate: [0, 4, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      >
        ⏱️
      </motion.div>

      <AnimatedSection className="text-center relative z-10">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={isInView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
          transition={{ duration: 0.8, type: "spring", stiffness: 200 }}
          className="flex items-center justify-center gap-3 mb-6"
        >
          <div className="p-4 bg-indigo-100 rounded-full">
            <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </motion.div>

        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-[clamp(4rem,14vw,9rem)] font-black text-indigo-600 leading-none"
        >
          {displayValue}+
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-[clamp(1.5rem,4vw,2.5rem)] text-gray-700 font-medium"
        >
          {displayUnit} saved
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-8 text-gray-600 text-xl max-w-lg mx-auto"
        >
          That&apos;s <span className="font-bold text-indigo-600">{formatMinutesToTime(minutesSavedBookkeeping)}</span>{" "}
          of bookkeeping automated away ✨
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-8 inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="font-medium">Automatic fulfilment & reconciliation</span>
        </motion.div>

        {/* Disclaimer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-10 text-gray-400 text-xs max-w-md mx-auto leading-relaxed"
        >
          *Calculated based on the average time taken to cross-reference bank transfer payments with registrations and
          collected forms.
        </motion.p>
      </AnimatedSection>
    </section>
  );
}
