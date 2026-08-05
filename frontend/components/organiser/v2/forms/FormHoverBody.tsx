"use client";

import { HoverList } from "@/components/organiser/v2/shared/EntityHoverPreview";
import { Form, FormSectionType } from "@/interfaces/FormTypes";

function sectionTypeLabel(type: FormSectionType): string {
  switch (type) {
    case FormSectionType.TEXT:
      return "Text";
    case FormSectionType.MULTIPLE_CHOICE:
      return "Multiple choice";
    case FormSectionType.DROPDOWN_SELECT:
      return "Dropdown";
    case FormSectionType.TICKBOX:
      return "Checkboxes";
    case FormSectionType.FILE_UPLOAD:
      return "File upload";
    case FormSectionType.DATE_TIME:
      return "Date & time";
    case FormSectionType.IMAGE:
      return "Image";
    default:
      return "Section";
  }
}

type FormHoverBodyProps = {
  form: Form;
};

/** First two questions — the one glance the row section-count chip cannot give. */
export function FormHoverBody({ form }: FormHoverBodyProps) {
  const sections = form.sectionsOrder
    .map((id) => form.sectionsMap[id])
    .filter(Boolean)
    .slice(0, 2);
  const remaining = Math.max(0, form.sectionsOrder.length - sections.length);

  return (
    <HoverList label="Questions">
      {sections.length === 0 ? (
        <p className="text-foreground-secondary">No questions yet.</p>
      ) : (
        <>
          {sections.map((section, index) => (
            <div key={`${form.formId}-hover-q-${index}`} className="flex items-baseline gap-3">
              <p className="min-w-0 flex-1 truncate text-foreground font-medium">
                {section.question || "Untitled question"}
                {section.required ? <span className="text-foreground-muted"> *</span> : null}
              </p>
              <span className="shrink-0 text-foreground-muted">{sectionTypeLabel(section.type)}</span>
            </div>
          ))}
          {remaining > 0 ? (
            <p className="text-foreground-muted">
              +{remaining} more question{remaining === 1 ? "" : "s"}
            </p>
          ) : null}
        </>
      )}
    </HoverList>
  );
}

export function FormHoverFlags({ form }: FormHoverBodyProps) {
  if (form.formActive) return null;
  return <>Inactive · Not collecting responses</>;
}
