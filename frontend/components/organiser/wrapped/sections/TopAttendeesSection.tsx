"use client";

import { AnimatedSection } from "@/components/organiser/wrapped/AnimatedSection";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface TopAttendeesSectionProps {
  topRegularAttendees: {
    name: string;
    email: string;
    attendanceCount: number;
  }[];
}

export function TopAttendeesSection({ topRegularAttendees }: TopAttendeesSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const medals = ["🥇", "🥈", "🥉", "4", "5"];

  return (
    <section
      ref={ref}
      className="min-h-screen flex items-center justify-center px-6 py-20 bg-white relative overflow-hidden"
    >
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <AnimatedSection className="w-full max-w-2xl relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-black text-black">Your MVPs</h2>
          <p className="mt-4 text-gray-500 text-lg">Top 5 most dedicated attendees</p>
        </div>

        <div className="space-y-4">
          {topRegularAttendees.slice(0, 5).map((attendee, index) => (
            <motion.div
              key={attendee.name}
              initial={{ opacity: 0, x: -50 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
              transition={{
                duration: 0.5,
                delay: 0.2 + index * 0.1,
                ease: "easeOut",
              }}
              className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
            >
              <div className="w-12 h-12 flex items-center justify-center text-2xl">
                {index < 3 ? (
                  <span>{medals[index]}</span>
                ) : (
                  <span className="text-gray-400 font-bold text-xl">#{index + 1}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-black text-lg">{attendee.name}</p>
                <p className="text-sm text-gray-500 truncate">{attendee.email}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-black">{attendee.attendanceCount}</p>
                <p className="text-sm text-gray-500">events</p>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatedSection>
    </section>
  );
}
