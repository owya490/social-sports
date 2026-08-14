"use client";

import { EventHubDescriptionEditor } from "@/components/organiser/v2/event-hub/EventHubDescriptionEditor";
import { FormDescription, FormTitle } from "@/interfaces/FormTypes";

type HeaderSectionBuilderProps = {
  formTitle: FormTitle;
  formDescription: FormDescription;
  updateFormTitle: (formTitle: FormTitle) => void;
  updateFormDescription: (formDescription: FormDescription) => void;
};

function normalizeDescription(html: string): FormDescription {
  const emptied = html
    .replace(/<p><br><\/p>/gi, "")
    .replace(/<p><\/p>/gi, "")
    .replace(/&nbsp;/gi, "")
    .trim();
  return (emptied === "" ? "" : html) as FormDescription;
}

export function HeaderSectionBuilder({
  formTitle,
  formDescription,
  updateFormTitle,
  updateFormDescription,
}: HeaderSectionBuilderProps) {
  return (
    <div className="rounded-xl border border-border bg-background px-4 py-4 sm:px-5 sm:py-5">
      <input
        type="text"
        value={formTitle}
        onChange={(e) => updateFormTitle(e.target.value as FormTitle)}
        placeholder="Untitled form"
        aria-label="Form title"
        className="w-full border-0 border-b border-border bg-transparent pb-2 text-xl sm:text-2xl font-semibold tracking-tight text-foreground font-sans placeholder:text-foreground-muted focus:outline-none"
      />

      <div className="mt-4 space-y-2">
        <span className="text-xs font-medium text-foreground-muted font-sans">Description</span>
        <EventHubDescriptionEditor
          description={formDescription}
          updateDescription={(value) => {
            const next = normalizeDescription(value);
            if (next === formDescription) return;
            updateFormDescription(next);
          }}
          placeholder="Add a short description"
          compact
        />
      </div>
    </div>
  );
}
