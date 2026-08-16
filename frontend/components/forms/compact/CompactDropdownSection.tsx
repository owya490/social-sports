"use client";

import { DropdownSelectSection } from "@/interfaces/FormTypes";
import Image from "next/image";

const fieldClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-base text-foreground font-sans focus:outline-none disabled:bg-surface disabled:text-foreground-muted";

export function CompactDropdownSection({
  dropdownSelectSection,
  answerOnChange,
  canEdit,
}: {
  dropdownSelectSection: DropdownSelectSection;
  answerOnChange: (answer: string) => void;
  canEdit: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-foreground font-sans leading-snug">
        {dropdownSelectSection.question || "Untitled question"}
        {dropdownSelectSection.required ? <span className="ml-1 text-danger">*</span> : null}
      </label>
      {dropdownSelectSection.imageUrl ? (
        <Image
          src={dropdownSelectSection.imageUrl}
          alt=""
          width={0}
          height={0}
          className="h-32 w-auto max-w-full rounded-lg object-cover"
        />
      ) : null}
      <select
        value={dropdownSelectSection.answer || ""}
        disabled={!canEdit}
        onChange={(e) => answerOnChange(e.target.value)}
        className={fieldClass}
      >
        <option value="" disabled>
          Select an option
        </option>
        {dropdownSelectSection.options.map((option, idx) => (
          <option key={idx} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
