"use client";

import {
  FormSectionControls,
  formEditorFieldClass,
} from "@/components/organiser/v2/forms/editor/FormSectionControls";
import { FormSection, SectionId, TickboxSection } from "@/interfaces/FormTypes";
import { PlusIcon } from "@heroicons/react/24/outline";
import { KeyboardEvent, useCallback, useRef } from "react";

type TickboxSectionBuilderProps = {
  section: TickboxSection;
  sectionId: SectionId;
  onUpdate: (section: FormSection) => void;
  onDelete: (sectionId: SectionId) => void;
  onDuplicate: (section: FormSection) => void;
};

export function TickboxSectionBuilder({
  section,
  sectionId,
  onUpdate,
  onDelete,
  onDuplicate,
}: TickboxSectionBuilderProps) {
  const optionInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const isLastOptionEmpty = () => {
    if (section.options.length === 0) return false;
    return section.options[section.options.length - 1] === "";
  };

  const updateSection = useCallback(
    (updates: Partial<TickboxSection>) => {
      onUpdate({ ...section, ...updates });
    },
    [section, onUpdate]
  );

  const handleOptionChange = (index: number, value: string) => {
    const updatedOptions = [...section.options];
    updatedOptions[index] = value;
    updateSection({ options: updatedOptions });
  };

  const handleAddOption = (atIndex?: number) => {
    const updatedOptions = [...section.options];
    if (atIndex !== undefined) {
      updatedOptions.splice(atIndex, 0, "");
    } else {
      updatedOptions.push("");
    }
    updateSection({ options: updatedOptions });
    if (atIndex !== undefined) {
      setTimeout(() => optionInputRefs.current[atIndex]?.focus(), 0);
    }
  };

  const handleRemoveOption = (index: number) => {
    const updatedOptions = section.options.filter((_, i) => i !== index);
    if (updatedOptions.length === 0) updatedOptions.push("");
    updateSection({ options: updatedOptions });
  };

  const handleDeleteEmptyOption = (index: number) => {
    if (section.options.length <= 1) return;
    updateSection({ options: section.options.filter((_, i) => i !== index) });
    setTimeout(() => {
      const targetIndex = index > 0 ? index - 1 : 0;
      optionInputRefs.current[targetIndex]?.focus();
    }, 0);
  };

  const handleOptionKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddOption(index + 1);
    } else if (e.key === "Backspace" && section.options[index] === "") {
      e.preventDefault();
      handleDeleteEmptyOption(index);
    }
  };

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={section.question}
        placeholder="Question"
        onChange={(e) => updateSection({ question: e.target.value })}
        className={formEditorFieldClass}
      />

      <div className="space-y-2">
        {section.options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <span
              aria-hidden
              className="h-4 w-4 shrink-0 rounded border-2 border-foreground-muted/50"
            />
            <input
              ref={(el) => {
                optionInputRefs.current[index] = el;
              }}
              type="text"
              value={option}
              placeholder={`Option ${index + 1}`}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              onKeyDown={(e) => handleOptionKeyDown(e, index)}
              className={formEditorFieldClass}
            />
            <button
              type="button"
              onClick={() => handleRemoveOption(index)}
              disabled={section.options.length === 1 && isLastOptionEmpty()}
              className="rounded-lg p-1.5 text-foreground-muted hover:bg-surface-hover hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              aria-label={`Remove option ${index + 1}`}
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => handleAddOption()}
          disabled={isLastOptionEmpty()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground-secondary font-sans hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <PlusIcon className="h-3.5 w-3.5" aria-hidden />
          Add option
        </button>
      </div>

      <FormSectionControls
        required={section.required}
        onRequiredChange={(required) => updateSection({ required })}
        onDelete={() => onDelete(sectionId)}
        onDuplicate={() => onDuplicate(section)}
      />
    </div>
  );
}
