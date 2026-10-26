"use client";

import FulfilmentEntityPage from "@/components/fulfilment/FulfilmentEntityPage";
import {
  FulfilmentEntityId,
  FulfilmentSessionId,
  GetFulfilmentSessionInfoResponse,
  PyngPaymentStatus,
} from "@/interfaces/FulfilmentTypes";
import { Logger } from "@/observability/logger";
import { refreshPyngCheckout } from "@/services/src/fulfilment/fulfilmentServices";
import { useEffect, useRef, useState } from "react";

export const PYNG_POLL_INTERVAL_MS = 60_000;

const logger = new Logger("PyngFulfilmentEntity");

export function pyngPollOutcome(status: PyngPaymentStatus): "pending" | "succeeded" | "failed" {
  if (status === "SUCCEEDED") {
    return "succeeded";
  }
  if (status === "EXPIRED" || status === "CANCELLED") {
    return "failed";
  }
  return "pending";
}

export function pyngSuccessPagePath(eventId: string | null | undefined): string | null {
  if (!eventId) {
    return null;
  }
  return `/event/success/${eventId}`;
}

export function openPyngCheckoutOnce(
  checkoutUrl: string | null,
  alreadyOpened: boolean,
  open: (url: string) => void
): boolean {
  if (alreadyOpened || !checkoutUrl) {
    return alreadyOpened;
  }
  open(checkoutUrl);
  return true;
}

type PyngCheckoutWaitingProps = {
  checkoutUrl: string | null;
  failed: boolean;
  refreshing: boolean;
  error: string;
  onRefresh: () => void;
};

export function PyngCheckoutWaiting({
  checkoutUrl,
  failed,
  refreshing,
  error,
  onRefresh,
}: PyngCheckoutWaitingProps) {
  if (failed) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold text-foreground font-sans">This payment did not complete</h1>
        <p className="mt-3 text-sm text-foreground-muted font-sans">
          The Pyng checkout expired or was declined. You can close this page.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold text-foreground font-sans">Payment in progress</h1>
      <p className="mt-3 text-sm text-foreground-muted font-sans">
        Pyng checkout will open in a new tab. Please keep this one open.
      </p>
      {checkoutUrl ? (
        <p className="mt-3 text-sm text-foreground-muted font-sans">
          If it does not open,{" "}
          <a
            href={checkoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline underline-offset-2"
          >
            click here
          </a>
          .
        </p>
      ) : null}
      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        className="mt-8 inline-flex items-center justify-center rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground font-sans hover:bg-surface-hover disabled:opacity-50"
      >
        {refreshing ? "Checking…" : "Refresh"}
      </button>
      {error ? <p className="mt-3 text-sm text-red-600 font-sans">{error}</p> : null}
    </div>
  );
}

type PyngFulfilmentEntityProps = {
  fulfilmentSessionId: FulfilmentSessionId;
  fulfilmentEntityId: FulfilmentEntityId;
  checkoutUrl: string | null;
  fulfilmentSessionInfo: GetFulfilmentSessionInfoResponse | null;
  onSucceeded: () => Promise<void>;
  onPrev: () => Promise<void>;
};

export default function PyngFulfilmentEntity({
  fulfilmentSessionId,
  fulfilmentEntityId,
  checkoutUrl,
  fulfilmentSessionInfo,
  onSucceeded,
  onPrev,
}: PyngFulfilmentEntityProps) {
  const currentIndex = fulfilmentSessionInfo?.currentEntityIndex ?? 0;
  const isFirstEntity = currentIndex === 0;
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const opened = useRef(false);
  const stopped = useRef(false);
  const inFlight = useRef(false);
  const onSucceededRef = useRef(onSucceeded);
  const pollRef = useRef<() => Promise<void>>(async () => {});
  onSucceededRef.current = onSucceeded;

  useEffect(() => {
    opened.current = openPyngCheckoutOnce(checkoutUrl, opened.current, (url) => {
      window.open(url, "_blank", "noopener,noreferrer");
    });
  }, [checkoutUrl]);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      if (cancelled || stopped.current || inFlight.current) {
        return;
      }
      inFlight.current = true;
      setRefreshing(true);
      try {
        const status = await refreshPyngCheckout(fulfilmentSessionId);
        if (cancelled || stopped.current) {
          return;
        }
        const outcome = pyngPollOutcome(status);
        if (outcome === "succeeded") {
          stopped.current = true;
          await onSucceededRef.current();
          return;
        }
        if (outcome === "failed") {
          stopped.current = true;
          setFailed(true);
          return;
        }
        setError("");
      } catch (pollError) {
        logger.error(
          `Failed to refresh Pyng checkout for session ${fulfilmentSessionId} entity ${fulfilmentEntityId}: ${pollError}`
        );
        if (!cancelled) {
          setError("Could not check the payment. We'll try again.");
        }
      } finally {
        inFlight.current = false;
        if (!cancelled) {
          setRefreshing(false);
        }
      }
    };

    pollRef.current = poll;
    void poll();
    const interval = setInterval(() => {
      void poll();
    }, PYNG_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [fulfilmentEntityId, fulfilmentSessionId]);

  return (
    <FulfilmentEntityPage
      onPrev={onPrev}
      showPrevButton={!isFirstEntity}
      showNextButton={false}
      fulfilmentSessionInfo={fulfilmentSessionInfo}
      fulfilmentSessionId={fulfilmentSessionId}
    >
      <PyngCheckoutWaiting
        checkoutUrl={checkoutUrl}
        failed={failed}
        refreshing={refreshing}
        error={error}
        onRefresh={() => {
          void pollRef.current();
        }}
      />
    </FulfilmentEntityPage>
  );
}
