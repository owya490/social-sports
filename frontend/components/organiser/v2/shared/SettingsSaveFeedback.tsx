"use client";

import type { SettingsAutosaveStatus } from "./useSettingsAutosave";

type SettingsSaveFeedbackProps = {
  status: SettingsAutosaveStatus;
  onRetry: () => void;
  errorMessage?: string | null;
  retryDisabled?: boolean;
  className?: string;
};

export function SettingsSaveFeedback({
  status,
  onRetry,
  errorMessage,
  retryDisabled = false,
  className = "",
}: SettingsSaveFeedbackProps) {
  const failed = status === "error";

  return (
    <div
      role={failed ? "alert" : "status"}
      aria-live={failed ? "assertive" : "polite"}
      aria-atomic="true"
      className={`min-w-0 max-w-full ${className}`}
    >
      {status === "saving" ? (
        <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-background px-3.5 py-2 text-xs font-medium text-foreground font-sans">
          <span
            className="h-3.5 w-3.5 shrink-0 animate-spin motion-reduce:animate-none rounded-full border-2 border-foreground/20 border-t-foreground"
            aria-hidden="true"
          />
          <span className="min-w-0 break-words">Saving changes…</span>
        </div>
      ) : status === "saved" ? (
        <div className="inline-flex max-w-full items-center rounded-full border border-border bg-background px-3.5 py-2 text-xs font-medium text-foreground font-sans">
          Saved
        </div>
      ) : failed ? (
        <div className="pointer-events-auto inline-flex max-w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-danger/30 bg-background px-3.5 py-1 text-xs font-medium text-danger font-sans">
          <span className="min-w-0 flex-1 break-words py-1">{errorMessage || "Couldn’t save changes."}</span>
          <button
            type="button"
            onClick={onRetry}
            disabled={retryDisabled}
            className="min-h-[44px] min-w-[44px] shrink-0 rounded-full border border-danger/30 px-3 text-xs font-semibold text-danger hover:bg-danger/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-60"
          >
            Retry
          </button>
        </div>
      ) : null}
    </div>
  );
}
