"use client";

import { ReactNode } from "react";

/**
 * Continuous workbench primitives for event hub tab bodies (A+B).
 * Flush plane under header — no nested white cards. Yellow only on primary CTAs.
 */

type EventHubStageProps = {
  children: ReactNode;
  className?: string;
};

export function EventHubStage({ children, className = "" }: EventHubStageProps) {
  return <div className={`min-w-0 ${className}`}>{children}</div>;
}

type EventHubToolbarProps = {
  meta: ReactNode;
  action?: ReactNode;
};

export function EventHubToolbar({ meta, action }: EventHubToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-3 pb-3">
      <div className="min-w-0 text-sm text-foreground-muted font-sans">{meta}</div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

type EventHubFilterTab = {
  id: string;
  label: string;
  count?: number;
};

type EventHubFiltersProps = {
  tabs: EventHubFilterTab[];
  activeId: string;
  onChange: (id: string) => void;
  action?: ReactNode;
};

export function EventHubFilters({ tabs, activeId, onChange, action }: EventHubFiltersProps) {
  return (
    <div className="flex items-end gap-3 border-b border-border">
      <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto overflow-y-hidden no-scrollbar" role="tablist">
        {tabs.map((tab) => {
          const active = activeId === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(tab.id)}
              className={`shrink-0 px-2.5 py-2.5 text-sm font-sans border-b-2 -mb-px transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus ${
                active
                  ? "border-foreground text-foreground font-semibold"
                  : "border-transparent text-foreground-secondary hover:text-foreground"
              }`}
            >
              {tab.label}
              {typeof tab.count === "number" ? (
                <span className={`ml-1 tabular-nums ${active ? "text-foreground" : "text-foreground-muted"}`}>
                  ({tab.count})
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {action ? <div className="shrink-0 pb-1.5">{action}</div> : null}
    </div>
  );
}

export function EventHubPrimaryButton({
  children,
  onClick,
  disabled,
  type = "button",
  form,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  form?: string;
}) {
  return (
    <button
      type={type}
      form={form}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-accent-contrast font-sans hover:brightness-95 transition-[filter] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function EventHubGhostButton({
  children,
  onClick,
  disabled,
  type = "button",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground font-sans hover:bg-surface-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}

export function EventHubEmpty({ children }: { children: ReactNode }) {
  return (
    <div className="py-14 text-center">
      <p className="text-sm text-foreground-muted font-sans max-w-sm mx-auto leading-relaxed">{children}</p>
    </div>
  );
}

type PreferenceRowProps = {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
};

export function EventHubPreferenceRow({
  title,
  description,
  checked,
  disabled,
  onChange,
}: PreferenceRowProps) {
  return (
    <div className="flex items-start gap-4 py-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground font-sans">{title}</p>
        <p className="mt-1 text-xs text-foreground-muted font-sans leading-relaxed">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 h-5 w-9 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-60 ${
          checked ? "bg-accent" : "bg-surface-muted"
        }`}
      >
        <span
          aria-hidden
          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-background border border-border transition-transform duration-200 ease-out ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

/** Registration strip tones — colour when on, muted grey when off. */
export type EventHubSettingTileTone = "green" | "stripe" | "blue" | "sky";

const SETTING_TILE_TONES: Record<
  EventHubSettingTileTone,
  { onWell: string; onIcon: string; onBorder: string }
> = {
  green: {
    onWell: "bg-[#EEF8E8]",
    onIcon: "text-[#73C358]",
    onBorder: "border-[#C5E8B0]",
  },
  /** Stripe brand purple ≈ #635BFF */
  stripe: {
    onWell: "bg-[#EEEDFF]",
    onIcon: "text-[#635BFF]",
    onBorder: "border-[#C7C3FF]",
  },
  blue: {
    onWell: "bg-[#EFF6FF]",
    onIcon: "text-[#2563EB]",
    onBorder: "border-[#BFDBFE]",
  },
  sky: {
    onWell: "bg-[#F0F9FF]",
    onIcon: "text-[#0284C7]",
    onBorder: "border-[#BAE6FD]",
  },
};

type SettingTileProps = {
  title: string;
  description?: string;
  icon: ReactNode;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  tone?: EventHubSettingTileTone;
  /** Label when checked (default On). */
  onLabel?: string;
  /** Label when unchecked (default Off). */
  offLabel?: string;
};

export function EventHubSettingTile({
  title,
  description,
  icon,
  checked,
  disabled,
  onChange,
  tone = "green",
  onLabel = "On",
  offLabel = "Off",
}: SettingTileProps) {
  const status = checked ? onLabel : offLabel;
  const toneStyles = SETTING_TILE_TONES[tone];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={`${title}: ${status}`}
      title={description}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`flex min-w-[7.5rem] flex-1 items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-[border-color,background-color,opacity] duration-200 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-60 ${
        checked
          ? `bg-background ${toneStyles.onBorder}`
          : "border-border bg-surface text-foreground-muted"
      } ${disabled ? "" : "hover:bg-surface-hover"}`}
    >
      <span
        aria-hidden
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors duration-200 ease-out ${
          checked ? `${toneStyles.onWell} ${toneStyles.onIcon}` : "bg-surface-muted text-foreground-muted"
        }`}
      >
        <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>
      </span>
      <span className="min-w-0">
        <span
          className={`block truncate text-xs font-semibold font-sans leading-tight ${
            checked ? "text-foreground" : "text-foreground-secondary"
          }`}
        >
          {title}
        </span>
        <span
          className={`mt-0.5 block text-xs font-sans leading-tight ${
            checked ? "text-foreground-secondary" : "text-foreground-muted"
          }`}
        >
          {status}
        </span>
      </span>
    </button>
  );
}

export function EventHubSettingTileRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2 pt-3 pb-1">{children}</div>;
}

export function EventHubInitials({ name }: { name: string }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <span
      aria-hidden
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold text-foreground-secondary font-sans tabular-nums"
    >
      {initials || "?"}
    </span>
  );
}
