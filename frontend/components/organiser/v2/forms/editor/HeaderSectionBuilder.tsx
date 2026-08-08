"use client";

import DescriptionRichTextEditor from "@/components/editor/DescriptionRichTextEditor";
import { RichTextEditorContent } from "@/components/editor/RichTextEditorContent";
import { FormDescription, FormTitle } from "@/interfaces/FormTypes";
import { useState } from "react";

type HeaderSectionBuilderProps = {
  formTitle: FormTitle;
  formDescription: FormDescription;
  updateFormTitle: (formTitle: FormTitle) => void;
  updateFormDescription: (formDescription: FormDescription) => void;
};

export function HeaderSectionBuilder({
  formTitle,
  formDescription,
  updateFormTitle,
  updateFormDescription,
}: HeaderSectionBuilderProps) {
  const [editingDescription, setEditingDescription] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-background px-4 py-4 sm:px-5 sm:py-5">
      <input
        type="text"
        value={formTitle}
        onChange={(e) => updateFormTitle(e.target.value as FormTitle)}
        placeholder="Untitled form"
        aria-label="Form title"
        className="w-full border-0 border-b border-border bg-transparent pb-2 text-xl sm:text-2xl font-semibold tracking-tight text-foreground font-sans placeholder:text-foreground-muted focus:outline-none focus:border-focus"
      />

      {editingDescription ? (
        <div className="mt-3 space-y-2">
          <DescriptionRichTextEditor
            description={formDescription}
            updateDescription={(value) => updateFormDescription(value as FormDescription)}
          />
          <button
            type="button"
            onClick={() => setEditingDescription(false)}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground font-sans hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            Done
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditingDescription(true)}
          className="mt-3 w-full rounded-xl border border-dashed border-border px-3 py-2.5 text-left text-sm text-foreground-secondary font-sans hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {formDescription ? (
            <div className="[&_.ProseMirror]:text-sm [&_.ProseMirror]:leading-relaxed [&_.ProseMirror_p]:my-1">
              <RichTextEditorContent description={formDescription} />
            </div>
          ) : (
            <span className="text-foreground-muted">Add a short description</span>
          )}
        </button>
      )}
    </div>
  );
}
