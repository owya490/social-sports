"use client";

import { MutableRefObject, useCallback, useEffect, useRef, useState } from "react";

export type SettingsAutosaveStatus = "idle" | "saving" | "saved" | "error";

export type SettingsAutosaveOperation = {
  apply: () => void;
  persist: () => Promise<void>;
  rollback: () => void;
};

export type SettingsAutosavePreparation =
  | { kind: "ready"; operation: SettingsAutosaveOperation }
  | { kind: "blocked"; message: string };

export type SettingsAutosaveResult = {
  kind: "saved" | "error" | "blocked" | "busy" | "disposed" | "idle";
};

type SettingsAutosaveOptions<Intent> = {
  prepare: (intent: Readonly<Intent>) => SettingsAutosavePreparation;
  mutationLockRef: MutableRefObject<boolean>;
  failureMessage?: string;
};

type SaveFeedback<Intent> = {
  status: SettingsAutosaveStatus;
  errorMessage: string | null;
  failedIntent: Readonly<Intent> | null;
};

export async function runOptimisticSave(operation: SettingsAutosaveOperation) {
  try {
    operation.apply();
    await operation.persist();
    return true;
  } catch {
    operation.rollback();
    return false;
  }
}

export function useSettingsAutosave<Intent>({
  prepare,
  mutationLockRef,
  failureMessage = "Couldn’t save changes. Please try again.",
}: SettingsAutosaveOptions<Intent>) {
  const [feedback, setFeedback] = useState<SaveFeedback<Intent>>({
    status: "idle",
    errorMessage: null,
    failedIntent: null,
  });
  const prepareRef = useRef(prepare);
  prepareRef.current = prepare;
  const failureMessageRef = useRef(failureMessage);
  failureMessageRef.current = failureMessage;
  const retryIntentRef = useRef<Readonly<Intent> | null>(null);
  const lifetimeRef = useRef({ active: true, generation: 0 });
  const attemptRef = useRef(0);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSavedTimer = useCallback(() => {
    if (savedTimerRef.current !== null) {
      clearTimeout(savedTimerRef.current);
      savedTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const lifetime = lifetimeRef.current;
    lifetime.active = true;
    lifetime.generation += 1;
    return () => {
      lifetime.active = false;
      lifetime.generation += 1;
      retryIntentRef.current = null;
      clearSavedTimer();
    };
  }, [clearSavedTimer]);

  useEffect(() => {
    if (feedback.status !== "saved") return;
    const generation = lifetimeRef.current.generation;
    const attempt = attemptRef.current;
    savedTimerRef.current = setTimeout(() => {
      if (
        lifetimeRef.current.active &&
        lifetimeRef.current.generation === generation &&
        attemptRef.current === attempt
      ) {
        setFeedback({ status: "idle", errorMessage: null, failedIntent: null });
      }
    }, 3000);
    return clearSavedTimer;
  }, [feedback, clearSavedTimer]);

  const run = useCallback(async (intent: Readonly<Intent>): Promise<SettingsAutosaveResult> => {
    if (!lifetimeRef.current.active) return { kind: "disposed" };
    if (mutationLockRef.current) return { kind: "busy" };

    mutationLockRef.current = true;
    const generation = lifetimeRef.current.generation;
    const isCurrent = () => lifetimeRef.current.active && lifetimeRef.current.generation === generation;
    const fallbackMessage = failureMessageRef.current;
    attemptRef.current += 1;
    clearSavedTimer();
    retryIntentRef.current = intent;
    setFeedback({ status: "saving", errorMessage: null, failedIntent: null });

    try {
      const preparation = prepareRef.current(intent);
      if (!isCurrent()) return { kind: "disposed" };
      if (preparation.kind === "blocked") {
        setFeedback({ status: "error", errorMessage: preparation.message, failedIntent: intent });
        return { kind: "blocked" };
      }

      const operation = preparation.operation;
      const succeeded = await runOptimisticSave({
        ...operation,
        rollback: () => {
          if (isCurrent()) operation.rollback();
        },
      });

      if (!isCurrent()) return { kind: "disposed" };
      if (succeeded) {
        retryIntentRef.current = null;
        setFeedback({ status: "saved", errorMessage: null, failedIntent: null });
        return { kind: "saved" };
      }
    } catch {
      if (!isCurrent()) return { kind: "disposed" };
    } finally {
      mutationLockRef.current = false;
    }

    setFeedback({ status: "error", errorMessage: fallbackMessage, failedIntent: intent });
    return { kind: "error" };
  }, [mutationLockRef, clearSavedTimer]);

  const retry = useCallback(async (): Promise<SettingsAutosaveResult> => {
    if (!lifetimeRef.current.active) return { kind: "disposed" };
    const intent = retryIntentRef.current;
    return intent === null ? { kind: "idle" } : run(intent);
  }, [run]);

  return { ...feedback, isSaving: feedback.status === "saving", run, retry };
}
