import { CSSProperties } from "react";
import scroll from "./landingScroll.module.css";

const WORDS = "Built for the people who run the game.".split(" ");

/** An oversized pause between dense sections; its words rise in one after another. */
export default function StatementLine() {
  return (
    <section aria-label="Built for the people who run the game" className="w-full bg-white px-6 py-28 md:py-40">
      <p className="mx-auto max-w-[1100px] text-balance text-center text-[clamp(2.5rem,7vw,6rem)] font-bold leading-[1.02] tracking-[-0.035em] text-core-text">
        {WORDS.map((word, index) => (
          <span key={index} className={scroll.wordRise} style={{ "--word": index } as CSSProperties}>
            {word}
            {index < WORDS.length - 1 ? " " : ""}
          </span>
        ))}
      </p>
    </section>
  );
}
