"use client";

import { DocumentDuplicateIcon, TrashIcon } from "@heroicons/react/24/outline";

type FormSectionControlsProps = {
  required?: boolean;
  onRequiredChange?: (required: boolean) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  showRequired?: boolean;
};

export function FormSectionControls({
  required = false,
  onRequiredChange,
  onDelete,
  onDuplicate,
  showRequired = true,
}: FormSectionControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-1 border-t border-border pt-3">
      <button
        type="button"
        onClick={onDelete}
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-foreground-secondary font-sans hover:bg-surface-hover hover:text-foreground transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <TrashIcon className="h-3.5 w-3.5" aria-hidden />
        Delete
      </button>
      <button
        type="button"
        onClick={onDuplicate}
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-foreground-secondary font-sans hover:bg-surface-hover hover:text-foreground transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <DocumentDuplicateIcon className="h-3.5 w-3.5" aria-hidden />
        Duplicate
      </button>
      {showRequired && onRequiredChange ? (
        <label className="ml-1 inline-flex items-center gap-2 pl-2 border-l border-border">
          <span className="text-xs font-medium text-foreground-muted font-sans">Required</span>
          <button
            type="button"
            role="switch"
            aria-checked={required}
            aria-label="Required"
            onClick={() => onRequiredChange(!required)}
            className={`relative h-5 w-9 shrink-0 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
              required ? "bg-accent" : "bg-surface-muted"
            }`}
          >
            <span
              aria-hidden
              className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-background border border-border transition-transform duration-200 ease-out ${
                required ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </label>
      ) : null}
    </div>
  );
}

export const formEditorFieldClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-base sm:text-sm text-foreground font-sans placeholder:text-foreground-muted focus:outline-none focus-visible:border-focus focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";
