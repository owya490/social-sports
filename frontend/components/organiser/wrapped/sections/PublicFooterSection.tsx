"use client";

import { AnimatedSection } from "@/components/organiser/wrapped/AnimatedSection";
import { motion } from "framer-motion";
import Link from "next/link";

interface PublicFooterSectionProps {
  organiserName: string;
  year: number;
  username: string;
}

/**
 * Footer section for public wrapped view with CTAs.
 */
export function PublicFooterSection({ organiserName, year, username }: PublicFooterSectionProps) {
  return (
    <section className="min-h-screen flex items-center justify-center px-6 py-20 bg-white relative overflow-hidden">
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            background: `radial-gradient(circle at 50% 50%, black 0%, transparent 70%)`,
          }}
        />
      </div>

      <AnimatedSection className="text-center relative z-10 max-w-2xl mx-auto">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2, type: "spring", bounce: 0.5 }}
          className="text-8xl mb-8"
        >
          🎊
        </motion.div>

        <h2 className="text-[clamp(2rem,6vw,4rem)] font-black text-black leading-tight">
          That&apos;s{" "}
          <span className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
            {organiserName}&apos;s
          </span>
          <br />
          {year} Wrapped!
        </h2>

        <p className="mt-6 text-gray-600 text-xl max-w-md mx-auto">
          Want to create your own year in review? Join SPORTSHUB and start organizing events today!
        </p>

        <div className="mt-12 flex flex-col sm:flex-row items-stretch justify-center gap-4">
          <Link href="/register" className="min-w-[240px]">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="h-full px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-full font-semibold text-lg flex items-center justify-center gap-3 hover:shadow-lg hover:shadow-orange-500/25 transition-all"
            >
              Get Started Free
              <span aria-hidden="true">&rarr;</span>
            </motion.div>
          </Link>

          <Link href={`/user/${username}`} className="min-w-[240px]">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="h-full px-8 py-4 bg-black text-white rounded-full font-semibold text-lg flex items-center justify-center gap-3 hover:bg-gray-800 transition-colors"
            >
              View {organiserName}&apos;s Events
            </motion.div>
          </Link>
        </div>

        <p className="mt-16 text-gray-400 text-sm">Powered by SPORTSHUB</p>
      </AnimatedSection>
    </section>
  );
}
