"use client";

import { Form, FormSection, FormSectionType } from "@/interfaces/FormTypes";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

type FormMiniaturePreviewProps = {
  form: Form;
  /** Max sections to paint inside the thumbnail. */
  maxSections?: number;
};

function MiniatureField({ section }: { section: FormSection }) {
  switch (section.type) {
    case FormSectionType.TEXT: {
      const question = section.question?.trim() || "Untitled question";
      return (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground leading-snug">
            {question}
            {section.required ? <span className="text-danger"> *</span> : null}
          </p>
          <div className="h-8 border-b border-border" />
        </div>
      );
    }
    case FormSectionType.MULTIPLE_CHOICE: {
      const question = section.question?.trim() || "Untitled question";
      return (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground leading-snug">
            {question}
            {section.required ? <span className="text-danger"> *</span> : null}
          </p>
          <div className="space-y-1.5">
            {section.options.slice(0, 4).map((option) => (
              <div key={option} className="flex items-center gap-2">
                <span className="h-3 w-3 shrink-0 rounded-full border border-foreground-muted" />
                <span className="text-xs text-foreground-secondary truncate">{option}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case FormSectionType.TICKBOX: {
      const question = section.question?.trim() || "Untitled question";
      return (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground leading-snug">
            {question}
            {section.required ? <span className="text-danger"> *</span> : null}
          </p>
          <div className="space-y-1.5">
            {section.options.slice(0, 4).map((option) => (
              <div key={option} className="flex items-center gap-2">
                <span className="h-3 w-3 shrink-0 rounded-[3px] border border-foreground-muted" />
                <span className="text-xs text-foreground-secondary truncate">{option}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case FormSectionType.DROPDOWN_SELECT: {
      const question = section.question?.trim() || "Untitled question";
      return (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground leading-snug">
            {question}
            {section.required ? <span className="text-danger"> *</span> : null}
          </p>
          <div className="flex h-8 w-40 items-center justify-between rounded-md border border-border bg-background px-2">
            <span className="text-xs text-foreground-muted truncate">
              {section.options[0] || "Choose"}
            </span>
            <ChevronDownIcon className="h-3 w-3 shrink-0 text-foreground-muted" aria-hidden />
          </div>
        </div>
      );
    }
    case FormSectionType.DATE_TIME: {
      const question = section.question?.trim() || "Untitled question";
      return (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground leading-snug">
            {question}
            {section.required ? <span className="text-danger"> *</span> : null}
          </p>
          <div className="h-8 w-36 rounded-md border border-border bg-background" />
        </div>
      );
    }
    case FormSectionType.FILE_UPLOAD: {
      const question = section.question?.trim() || "Untitled question";
      return (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground leading-snug">
            {question}
            {section.required ? <span className="text-danger"> *</span> : null}
          </p>
          <div className="flex h-10 w-44 items-center justify-center rounded-md border border-dashed border-border bg-background text-xs text-foreground-muted">
            Upload file
          </div>
        </div>
      );
    }
    case FormSectionType.IMAGE: {
      const label = section.question?.trim() || "Untitled image";
      return (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground leading-snug">{label}</p>
          <div className="h-20 rounded-md bg-surface-muted" />
        </div>
      );
    }
    default: {
      const _exhaustive: never = section;
      return _exhaustive;
    }
  }
}

/**
 * Non-interactive paper miniature of a form's real questions — sized for CSS
 * scale inside gallery thumbnails (Google Forms / Docs craft bar).
 */
export function FormMiniaturePreview({ form, maxSections = 5 }: FormMiniaturePreviewProps) {
  const title = form.title?.trim() || "Untitled form";
  const sections = form.sectionsOrder
    .map((id) => form.sectionsMap[id])
    .filter(Boolean)
    .slice(0, maxSections);

  return (
    <div className="w-[420px] rounded-lg border border-border bg-background px-5 py-4 pb-10 font-sans text-foreground shadow-[0_1px_2px_rgba(10,10,10,0.04)]">
      <div className="border-b border-border pb-3 mb-4">
        <p className="text-lg font-bold tracking-tight leading-tight truncate">{title}</p>
        {!form.formActive ? (
          <p className="mt-1 text-xs font-medium text-foreground-muted">Inactive</p>
        ) : null}
      </div>
      {sections.length === 0 ? (
        <p className="text-xs text-foreground-muted py-6 text-center">No questions yet</p>
      ) : (
        <div className="space-y-5">
          {sections.map((section, index) => (
            <MiniatureField key={`${form.formId}-mini-${index}`} section={section} />
          ))}
        </div>
      )}
    </div>
  );
}
