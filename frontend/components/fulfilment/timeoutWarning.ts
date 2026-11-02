export const TIMEOUT_WARNING_THRESHOLD_MS = 30 * 1000;

export function shouldShowTimeoutWarning(remainingMs: number | null, dismissed: boolean): boolean {
  if (remainingMs === null) {
    return false;
  }
  return remainingMs > 0 && remainingMs <= TIMEOUT_WARNING_THRESHOLD_MS && !dismissed;
}

export function shouldResetTimeoutWarningDismissal(remainingMs: number | null): boolean {
  return remainingMs !== null && remainingMs > TIMEOUT_WARNING_THRESHOLD_MS;
}
