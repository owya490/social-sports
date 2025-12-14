"use client";

import { AnimatedSection } from "@/components/organiser/wrapped/AnimatedSection";
import { CountUpNumber } from "@/components/organiser/wrapped/CountUpNumber";
import { motion, useInView } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";

interface TotalSalesSectionProps {
  totalSales: number;
}

// Falling money emoji component
function FallingMoney({ delay, x }: { delay: number; x: string }) {
  return (
    <motion.div
      className="absolute text-3xl md:text-4xl select-none pointer-events-none"
      style={{ left: x, top: "-50px" }}
      initial={{ y: -50, opacity: 0, rotate: 0 }}
      animate={{
        y: ["0vh", "110vh"],
        opacity: [0, 1, 1, 0],
        rotate: [0, 360],
      }}
      transition={{
        delay,
        duration: 4,
        repeat: Infinity,
        repeatDelay: 2,
        ease: "linear",
      }}
    >
      💵
    </motion.div>
  );
}

export function TotalSalesSection({ totalSales }: TotalSalesSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  // Generate falling money positions
  const moneyPositions = [
    { x: "5%", delay: 0 },
    { x: "15%", delay: 0.5 },
    { x: "25%", delay: 1.2 },
    { x: "35%", delay: 0.3 },
    { x: "50%", delay: 0.8 },
    { x: "65%", delay: 1.5 },
    { x: "75%", delay: 0.2 },
    { x: "85%", delay: 1 },
    { x: "95%", delay: 0.7 },
  ];

  return (
    <section
      ref={ref}
      className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)",
      }}
    >
      {/* Falling money animation */}
      {moneyPositions.map((pos, i) => (
        <FallingMoney key={i} x={pos.x} delay={pos.delay} />
      ))}

      <AnimatedSection className="text-center relative z-10">
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-green-600 text-xl uppercase tracking-[0.2em] mb-4 font-semibold"
        >
          Making it Rain 💸
        </motion.p>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="text-[clamp(3rem,12vw,8rem)] font-black text-black leading-none"
        >
          <CountUpNumber value={Math.round(totalSales / 100)} prefix="$" duration={2.5} />
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-4 text-gray-500 text-lg uppercase tracking-[0.15em]"
        >
          Total Sales
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-6 text-gray-600 text-xl max-w-md mx-auto"
        >
          Seamless instant payments
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="mt-6 inline-flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-lg"
        >
          <Image
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQQGluJhW7I1NYU7jF77E-9K9I46_ib_DUNHw&s"
            alt="Stripe"
            width={32}
            height={32}
            className="rounded"
          />
          <span className="text-gray-600 font-medium">Stripe-powered</span>
        </motion.div>
      </AnimatedSection>
    </section>
  );
}
