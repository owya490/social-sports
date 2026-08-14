"use client";

import {
  FormSectionControls,
  formEditorFieldClass,
} from "@/components/organiser/v2/forms/editor/FormSectionControls";
import { FormSection, SectionId } from "@/interfaces/FormTypes";

type TextSectionBuilderProps = {
  section: FormSection;
  sectionId: SectionId;
  onUpdate: (section: FormSection) => void;
  onDelete: (sectionId: SectionId) => void;
  onDuplicate: (section: FormSection) => void;
};

export function TextSectionBuilder({
  section,
  sectionId,
  onUpdate,
  onDelete,
  onDuplicate,
}: TextSectionBuilderProps) {
  return (
    <div className="space-y-3">
      <input
        type="text"
        value={section.question}
        placeholder="Question"
        onChange={(e) => onUpdate({ ...section, question: e.target.value })}
        className={formEditorFieldClass}
      />
      <div
        aria-hidden
        className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground-muted font-sans"
      >
        Short answer
      </div>
      <FormSectionControls
        required={section.required}
        onRequiredChange={(required) => onUpdate({ ...section, required })}
        onDelete={() => onDelete(sectionId)}
        onDuplicate={() => onDuplicate(section)}
      />
    </div>
  );
}
