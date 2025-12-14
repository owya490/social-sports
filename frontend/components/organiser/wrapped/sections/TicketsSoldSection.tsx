"use client";

import { AnimatedSection } from "@/components/organiser/wrapped/AnimatedSection";
import { CountUpNumber } from "@/components/organiser/wrapped/CountUpNumber";

interface TicketsSoldSectionProps {
  ticketsSold: number;
}

export function TicketsSoldSection({ ticketsSold }: TicketsSoldSectionProps) {
  return (
    <section className="min-h-screen flex items-center justify-center px-6 bg-black relative overflow-hidden">
      {/* Sports imagery background */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{
          backgroundImage: `url('https://wallpapercat.com/w/full/6/0/7/299415-3840x2160-desktop-4k-badminton-background-image.jpg')`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black via-transparent to-black" />

      <AnimatedSection className="text-center relative z-10">
        <p className="text-gray-400 text-xl uppercase tracking-[0.3em] mb-4">Players Joined</p>
        <div className="text-[clamp(5rem,18vw,12rem)] font-black text-white leading-none">
          <CountUpNumber value={ticketsSold} />
        </div>
        <p className="mt-8 text-[clamp(1.5rem,4vw,2.5rem)] text-white/80 font-light">tickets sold 🎟️</p>
        <p className="mt-4 text-gray-500 text-lg">Games played. Memories made.</p>
      </AnimatedSection>
    </section>
  );
}
