"use client";

import { CheckCircleIcon, DocumentTextIcon, ListBulletIcon, PhotoIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";

type FormEditorToolbarProps = {
  onAddTextSection: () => void;
  onAddDropdownSection: () => void;
  onAddTickboxSection: () => void;
  onAddImageSection: () => void;
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
}: FormEditorToolbarProps) {
  const handlers = {
    text: onAddTextSection,
    dropdown: onAddDropdownSection,
    tickbox: onAddTickboxSection,
    image: onAddImageSection,
  };

  return (
    <>
      <aside className="hidden md:flex sticky top-6 z-30 w-12 shrink-0 flex-col items-center gap-1 rounded-xl border border-border bg-background p-1.5 h-fit">
        {tools.map(({ key, label, Icon }) => (
          <ToolbarIconButton
            key={key}
            label={label}
            ariaLabel={`Add ${label.toLowerCase()} question`}
            onClick={handlers[key]}
          >
            <Icon className="h-5 w-5" aria-hidden />
          </ToolbarIconButton>
        ))}
      </aside>

      <div className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-3xl items-center justify-center gap-1 px-3 py-2">
          {tools.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={handlers[key]}
              aria-label={`Add ${label.toLowerCase()} question`}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-foreground-secondary hover:bg-surface-hover hover:text-foreground transition-colors duration-150 ease-out focus:outline-none"
            >
              <Icon className="h-5 w-5" aria-hidden />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function ToolbarIconButton({
  label,
  ariaLabel,
  onClick,
  children,
}: {
  label: string;
  ariaLabel: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="group relative flex h-9 w-9 items-center justify-center rounded-lg text-foreground-secondary hover:bg-surface-hover hover:text-foreground transition-colors duration-150 ease-out focus:outline-none"
    >
      {children}
      <span
        aria-hidden
        className="pointer-events-none absolute left-full top-1/2 z-[60] ml-2 -translate-y-1/2 translate-x-0.5 whitespace-nowrap rounded-lg border border-border bg-background px-2 py-1 text-xs font-medium text-foreground font-sans shadow-[0_8px_20px_rgba(10,10,10,0.08)] opacity-0 transition-[opacity,transform] duration-100 ease-out delay-0 group-hover:translate-x-0 group-hover:opacity-100 group-hover:delay-[50ms] group-focus-visible:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:delay-0"
      >
        {label}
      </span>
    </button>
  );
}
