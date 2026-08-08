"use client";

import DescriptionRichTextEditor from "@/components/editor/DescriptionRichTextEditor";
import { RichTextEditorContent } from "@/components/editor/RichTextEditorContent";
import { InputHTMLAttributes, ReactNode } from "react";

export const profileFieldClass =
  "w-full min-w-0 rounded-xl border-0 bg-transparent py-2.5 px-3 text-base sm:text-sm text-foreground font-sans placeholder:text-foreground-muted focus:outline-none disabled:opacity-60";

export const profileFieldShellClass =
  "relative flex items-center rounded-xl border border-border bg-background focus-within:border-focus focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus";

type ProfileSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function ProfileSection({ title, description, children, footer }: ProfileSectionProps) {
  return (
    <section className="rounded-xl border border-border bg-background overflow-hidden">
      <div className="px-4 sm:px-5 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground font-sans">{title}</h2>
        {description ? <p className="mt-0.5 text-xs text-foreground-muted font-sans">{description}</p> : null}
      </div>
      <div className="p-4 sm:p-5 space-y-4">{children}</div>
      {footer ? <div className="border-t border-border px-4 sm:px-5 py-3 bg-surface/60">{footer}</div> : null}
    </section>
  );
}

type ProfileFieldProps = {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
};

export function ProfileField({ label, htmlFor, hint, children, className = "" }: ProfileFieldProps) {
  return (
    <label htmlFor={htmlFor} className={`block space-y-1.5 ${className}`}>
      <span className="text-xs font-medium text-foreground-muted font-sans">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-foreground-muted font-sans">{hint}</span> : null}
    </label>
  );
}

type ProfileTextInputProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  prefix?: string;
  type?: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
};

export function ProfileTextInput({
  id,
  value,
  onChange,
  placeholder,
  disabled,
  prefix,
  type = "text",
  inputMode,
  autoComplete,
}: ProfileTextInputProps) {
  return (
    <div className={profileFieldShellClass}>
      {prefix ? (
        <span className="pl-3 text-sm text-foreground-muted font-sans shrink-0" aria-hidden>
          {prefix}
        </span>
      ) : null}
      <input
        id={id}
        type={type}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className={`${profileFieldClass} ${prefix ? "pl-1.5" : ""}`}
      />
    </div>
  );
}

type ProfileSelectProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
};

export function ProfileSelect({ id, value, onChange, options, disabled }: ProfileSelectProps) {
  return (
    <div className={profileFieldShellClass}>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`${profileFieldClass} pr-8 appearance-none`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

type ProfileReadonlyProps = {
  label: string;
  value: string;
  action?: ReactNode;
};

export function ProfileReadonlyField({ label, value, action }: ProfileReadonlyProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-foreground-muted font-sans">{label}</p>
        {action}
      </div>
      <div className="rounded-xl border border-border bg-surface px-3 py-2.5">
        <p className="text-sm text-foreground font-sans break-all">{value || "—"}</p>
      </div>
    </div>
  );
}

type ProfileBioEditorProps = {
  value: string;
  onChange: (value: string) => void;
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
};

export function ProfileBioEditor({ value, onChange, editing, onEditingChange }: ProfileBioEditorProps) {
  if (!editing) {
    return (
      <div className="space-y-2">
        <div className="rounded-xl border border-border bg-surface px-3 py-2.5 min-h-[4.5rem]">
          {value ? (
            <div className="text-sm text-foreground font-sans">
              <RichTextEditorContent description={value} />
            </div>
          ) : (
            <p className="text-sm text-foreground-muted font-sans">No bio yet — add a short introduction.</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onEditingChange(true)}
          className="text-xs font-semibold text-foreground font-sans hover:underline"
        >
          Edit bio
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-border bg-background overflow-hidden focus-within:border-focus focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus">
        <DescriptionRichTextEditor description={value} updateDescription={onChange} />
      </div>
      <button
        type="button"
        onClick={() => onEditingChange(false)}
        className="text-xs font-semibold text-foreground-secondary font-sans hover:text-foreground"
      >
        Done editing
      </button>
    </div>
  );
}
