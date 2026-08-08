"use client";

import { CheckCircleIcon, DocumentTextIcon, ListBulletIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { FloppyDiskIcon } from "@sidekickicons/react/24/solid";

type FormEditorToolbarProps = {
  onAddTextSection: () => void;
  onAddDropdownSection: () => void;
  onAddTickboxSection: () => void;
  onAddImageSection: () => void;
  onSaveForm: () => void;
  isFormModified: boolean;
  isSubmitting: boolean;
};

const tools = [
  { key: "text", label: "Text", Icon: DocumentTextIcon },
  { key: "dropdown", label: "Dropdown", Icon: ListBulletIcon },
  { key: "tickbox", label: "Tickbox", Icon: CheckCircleIcon },
  { key: "image", label: "Image", Icon: PhotoIcon },
] as const;

export function FormEditorToolbar({
  onAddTextSection,
  onAddDropdownSection,
  onAddTickboxSection,
  onAddImageSection,
  onSaveForm,
  isFormModified,
  isSubmitting,
}: FormEditorToolbarProps) {
  const handlers = {
    text: onAddTextSection,
    dropdown: onAddDropdownSection,
    tickbox: onAddTickboxSection,
    image: onAddImageSection,
  };

  return (
    <>
      {/* Desktop — sticky side rail */}
      <aside className="hidden md:flex sticky top-6 w-12 shrink-0 flex-col items-center gap-1 rounded-xl border border-border bg-background p-1.5 h-fit">
        {tools.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            onClick={handlers[key]}
            title={label}
            aria-label={`Add ${label.toLowerCase()} question`}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground-secondary hover:bg-surface-hover hover:text-foreground transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <Icon className="h-5 w-5" aria-hidden />
          </button>
        ))}
        <div className="my-1 h-px w-6 bg-border" />
        <button
          type="button"
          onClick={onSaveForm}
          disabled={!isFormModified || isSubmitting}
          title={isFormModified ? "Save form" : "No changes to save"}
          aria-label="Save form"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-contrast hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed transition-[filter,opacity] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {isSubmitting ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-contrast/30 border-t-accent-contrast" />
          ) : (
            <FloppyDiskIcon className="h-4 w-4" aria-hidden />
          )}
        </button>
      </aside>

      {/* Mobile — fixed bottom bar */}
      <div className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-3 py-2">
          <div className="flex items-center gap-1">
            {tools.map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                onClick={handlers[key]}
                aria-label={`Add ${label.toLowerCase()} question`}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-foreground-secondary hover:bg-surface-hover hover:text-foreground transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                <Icon className="h-5 w-5" aria-hidden />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onSaveForm}
            disabled={!isFormModified || isSubmitting}
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3.5 py-2 text-sm font-semibold text-accent-contrast font-sans hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed transition-[filter,opacity] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            {isSubmitting ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent-contrast/30 border-t-accent-contrast" />
            ) : (
              <FloppyDiskIcon className="h-4 w-4" aria-hidden />
            )}
            Save
          </button>
        </div>
      </div>
    </>
  );
}
