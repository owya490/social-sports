"use client";

import { TextSection } from "@/interfaces/FormTypes";
import Image from "next/image";

const fieldClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-base text-foreground font-sans placeholder:text-foreground-muted focus:outline-none focus-visible:border-focus focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:bg-surface disabled:text-foreground-muted";

export function CompactTextSection({
  textSection,
  answerOnChange,
  canEdit,
}: {
  textSection: TextSection;
  answerOnChange: (answer: string) => void;
  canEdit: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-foreground font-sans leading-snug">
        {textSection.question || "Untitled question"}
        {textSection.required ? <span className="ml-1 text-danger">*</span> : null}
      </label>
      {textSection.imageUrl ? (
        <Image
          src={textSection.imageUrl}
          alt=""
          width={0}
          height={0}
          className="h-32 w-auto max-w-full rounded-lg object-cover"
        />
      ) : null}
      <textarea
        rows={2}
        value={textSection.answer || ""}
        disabled={!canEdit}
        placeholder="Your answer"
        onChange={(e) => answerOnChange(e.target.value)}
        className={`${fieldClass} min-h-[2.75rem] resize-y`}
      />
    </div>
  );
}
