/**
 * WebKit (iOS Safari especially) can stall Firestore's default fetch-stream
 * WebChannel transport for tens of seconds. Firebase's recommended workaround
 * is to disable fetch streams on WebKit; iOS also forces long-polling.
 * @see https://github.com/firebase/firebase-js-sdk/issues/9789
 */
export type FirestoreWebKitTransportSettings = {
  useFetchStreams: false;
  experimentalForceLongPolling?: true;
};

export function getFirestoreSettingsForUserAgent(
  userAgent: string | undefined,
  options?: { maxTouchPoints?: number; platform?: string }
): FirestoreWebKitTransportSettings | null {
  if (!userAgent) {
    return null;
  }

  const isIos =
    /iPad|iPhone|iPod/.test(userAgent) ||
    (options?.platform === "MacIntel" && (options.maxTouchPoints ?? 0) > 1);
  const isMacSafari =
    /Safari/i.test(userAgent) && !/Chrome|Chromium|Android|CriOS|FxiOS|EdgiOS|Edg\//i.test(userAgent);

  if (isIos) {
    return { useFetchStreams: false, experimentalForceLongPolling: true };
  }
  if (isMacSafari) {
    return { useFetchStreams: false };
  }
  return null;
}

export function getFirestoreSettingsForCurrentBrowser(): FirestoreWebKitTransportSettings | null {
  if (typeof navigator === "undefined") {
    return null;
  }
  return getFirestoreSettingsForUserAgent(navigator.userAgent, {
    maxTouchPoints: navigator.maxTouchPoints,
    platform: navigator.platform,
  });
}
