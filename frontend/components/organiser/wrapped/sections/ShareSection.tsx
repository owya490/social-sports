"use client";

import { AnimatedSection } from "@/components/organiser/wrapped/AnimatedSection";
import { Confetti } from "@/components/organiser/wrapped/Confetti";
import { useUser } from "@/components/utility/UserContext";
import { Logger } from "@/observability/logger";
import { getUrlWithCurrentHostname } from "@/services/src/urlUtils";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { useRef, useState } from "react";

interface ShareSectionProps {
  organiserName: string;
  year: number;
  wrappedId: string;
}

const logger = new Logger("ShareSection");

export function ShareSection({ organiserName, year, wrappedId }: ShareSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [copied, setCopied] = useState(false);
  const { user } = useUser();

  const shareUrl = getUrlWithCurrentHostname(`/${user.username}/wrapped/${year}?wrappedId=${wrappedId}`);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      logger.error("Failed to copy: " + err);
    }
  };

  return (
    <section
      ref={ref}
      className="min-h-screen flex items-center justify-center px-6 py-20 bg-white relative overflow-hidden"
    >
      {isInView && <Confetti />}

      {/* Background gradient */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            background: `radial-gradient(circle at 50% 50%, black 0%, transparent 70%)`,
          }}
        />
      </div>

      {/* Floating emojis */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-[10%] text-4xl">🎉</div>
        <div className="absolute top-32 right-[15%] text-3xl">🏆</div>
        <div className="absolute bottom-36 left-[20%] text-3xl">⚽</div>
        <div className="absolute bottom-32 right-[10%] text-4xl">🔥</div>
        <div className="absolute top-1/2 left-[5%] text-2xl">✨</div>
        <div className="absolute top-1/3 right-[8%] text-2xl">💪</div>
      </div>

      <AnimatedSection className="text-center relative z-10 max-w-2xl mx-auto">
        <motion.div
          initial={{ scale: 0 }}
          animate={isInView ? { scale: 1 } : { scale: 0 }}
          transition={{ duration: 0.5, delay: 0.2, type: "spring", bounce: 0.5 }}
          className="text-8xl mb-8"
        >
          🎊
        </motion.div>

        <h2 className="text-[clamp(2rem,6vw,4rem)] font-black text-black leading-tight">
          That&apos;s a wrap,
          <br />
          <span className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
            {organiserName}!
          </span>
        </h2>

        <p className="mt-6 text-gray-600 text-xl max-w-md mx-auto">
          Share your {year} SPORTSHUB Wrapped with your community and celebrate your achievements!
        </p>

        {/* Action Buttons */}
        <div className="mt-12 flex flex-col sm:flex-row items-stretch justify-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCopyLink}
            className="px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-full font-semibold text-lg flex items-center justify-center gap-3 hover:shadow-lg hover:shadow-orange-500/25 transition-all min-w-[240px]"
          >
            {copied ? (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Link Copied!
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                Share Link
              </>
            )}
          </motion.button>

          <Link href="/organiser/dashboard" className="min-w-[240px]">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="h-full px-8 py-4 bg-black text-white rounded-full font-semibold text-lg flex items-center justify-center gap-3 hover:bg-gray-800 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Return to Dashboard
            </motion.div>
          </Link>
        </div>

        <p className="mt-16 text-gray-400 text-sm">
          Thank you for choosing SPORTSHUB. Here&apos;s to an even bigger {year + 1}! 🚀
        </p>
      </AnimatedSection>
    </section>
  );
}
