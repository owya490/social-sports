"use client";

import { EventHubDescriptionEditor } from "@/components/organiser/v2/event-hub/EventHubDescriptionEditor";
import { InputHTMLAttributes, ReactNode } from "react";

export const profileFieldClass =
  "w-full min-w-0 rounded-xl border-0 bg-transparent py-2.5 px-3 text-base sm:text-sm leading-6 text-foreground font-sans placeholder:text-foreground-muted outline-none ring-0 shadow-none focus:outline-none focus:ring-0 focus:shadow-none focus-visible:outline-none focus-visible:ring-0 disabled:opacity-60";

export const profileFieldShellClass =
  "relative flex items-center min-h-[2.875rem] rounded-xl border border-border bg-background";

const profileLabelClass = "block h-4 text-xs font-medium leading-4 text-foreground-muted font-sans";

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
  error?: string;
  children: ReactNode;
  className?: string;
};

export function ProfileField({ label, htmlFor, hint, error, children, className = "" }: ProfileFieldProps) {
  return (
    <label htmlFor={htmlFor} className={`block space-y-1.5 ${className}`}>
      <span className={profileLabelClass}>{label}</span>
      {children}
      {error ? (
        <span className="block text-xs text-danger font-sans">{error}</span>
      ) : hint ? (
        <span className="block text-xs text-foreground-muted font-sans">{hint}</span>
      ) : null}
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
  invalid?: boolean;
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
  invalid,
}: ProfileTextInputProps) {
  return (
    <div className={profileFieldShellClass}>
      {prefix ? (
        <span className="pl-3 text-base sm:text-sm leading-6 text-foreground-muted font-sans shrink-0" aria-hidden>
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
        aria-invalid={invalid || undefined}
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
    <div className="block space-y-1.5">
      {action ? (
        <div className="flex h-4 items-center justify-between gap-2">
          <span className={profileLabelClass}>{label}</span>
          {action}
        </div>
      ) : (
        <span className={profileLabelClass}>{label}</span>
      )}
      <div className={`${profileFieldShellClass} bg-surface`}>
        <input
          readOnly
          tabIndex={-1}
          value={value || "—"}
          aria-label={label}
          title={value || undefined}
          className={`${profileFieldClass} cursor-default`}
        />
      </div>
    </div>
  );
}

type ProfileBioEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

export function ProfileBioEditor({ value, onChange }: ProfileBioEditorProps) {
  return (
    <EventHubDescriptionEditor
      description={value}
      updateDescription={onChange}
      placeholder="A short introduction for your public profile."
      compact
    />
  );
}
