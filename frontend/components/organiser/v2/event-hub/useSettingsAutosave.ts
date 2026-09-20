"use client";

import { useCallback, useRef, useState } from "react";

export type SettingsAutosaveStatus = "idle" | "saving" | "error";

export type SettingsAutosaveOperation = {
  apply: () => void;
  persist: () => Promise<void>;
  rollback: () => void;
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

export function useSettingsAutosave() {
  const [status, setStatus] = useState<SettingsAutosaveStatus>("idle");
  const inFlightRef = useRef(false);
  const retryOperationRef = useRef<SettingsAutosaveOperation | null>(null);

  const run = useCallback(async (operation: SettingsAutosaveOperation) => {
    if (inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;
    setStatus("saving");
    const succeeded = await runOptimisticSave(operation);
    inFlightRef.current = false;
    if (succeeded) {
      retryOperationRef.current = null;
      setStatus("idle");
      return;
    }

    retryOperationRef.current = operation;
    setStatus("error");
  }, []);

  const retry = useCallback(() => {
    const operation = retryOperationRef.current;
    if (operation) {
      void run(operation);
    }
  }, [run]);

  return { status, isSaving: status === "saving", run, retry };
}
