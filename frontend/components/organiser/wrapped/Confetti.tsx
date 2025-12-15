"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useMemo } from "react";

const CONFETTI_COLORS = ["#000000", "#333333", "#666666", "#999999", "#CCCCCC"];

interface ConfettiPiece {
  id: number;
  x: number;
  delay: number;
  duration: number;
  color: string;
  rotation: number;
  size: number;
}

export function Confetti() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const pieces: ConfettiPiece[] = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 2,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotation: Math.random() * 360,
      size: 8 + Math.random() * 8,
    }));
  }, []);

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden pointer-events-none">
      {isInView &&
        pieces.map((piece) => (
          <motion.div
            key={piece.id}
            initial={{
              opacity: 0,
              y: -20,
              x: `${piece.x}vw`,
              rotate: 0,
            }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: ["0vh", "100vh"],
              rotate: piece.rotation + 720,
            }}
            transition={{
              duration: piece.duration,
              delay: piece.delay,
              ease: "easeOut",
            }}
            className="absolute top-0"
            style={{
              width: piece.size,
              height: piece.size,
              backgroundColor: piece.color,
              borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            }}
          />
        ))}
    </div>
  );
}

