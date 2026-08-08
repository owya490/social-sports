"use client";

import { TickboxSection } from "@/interfaces/FormTypes";
import Image from "next/image";

export function CompactTickboxSection({
  tickboxSection,
  answerOnChange,
  canEdit,
}: {
  tickboxSection: TickboxSection;
  answerOnChange: (answer: string[]) => void;
  canEdit: boolean;
}) {
  const handleCheckboxChange = (option: string, checked: boolean) => {
    const currentAnswers = tickboxSection.answer || [];
    const newAnswers = checked ? [...currentAnswers, option] : currentAnswers.filter((a) => a !== option);
    answerOnChange(newAnswers);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-foreground font-sans leading-snug">
        {tickboxSection.question || "Untitled question"}
        {tickboxSection.required ? <span className="ml-1 text-danger">*</span> : null}
      </p>
      {tickboxSection.imageUrl ? (
        <Image
          src={tickboxSection.imageUrl}
          alt=""
          width={0}
          height={0}
          className="h-32 w-auto max-w-full rounded-lg object-cover"
        />
      ) : null}
      <div className="space-y-1">
        {tickboxSection.options.map((option, idx) => {
          const isChecked = tickboxSection.answer?.includes(option) || false;
          return (
            <label
              key={idx}
              className={`flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 transition-colors ${
                canEdit ? "hover:bg-surface-hover cursor-pointer" : "opacity-70"
              } ${isChecked ? "bg-surface" : "bg-background"}`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                disabled={!canEdit}
                onChange={(e) => handleCheckboxChange(option, e.target.checked)}
                className="h-4 w-4 shrink-0 rounded border-border text-foreground accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              />
              <span className="text-sm text-foreground font-sans leading-snug">{option}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
