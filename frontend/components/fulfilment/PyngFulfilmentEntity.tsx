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
import { ArrowPathIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { ReactNode, useEffect, useRef, useState } from "react";

export const PYNG_POLL_INTERVAL_MS = 60_000;
export const PYNG_SUCCESS_REDIRECT_SECONDS = 5;

export function pyngRefreshFeedback(outcome: "pending" | "succeeded", secondsRemaining: number): string {
  if (outcome === "succeeded") {
    return `We'll redirect you in ${secondsRemaining}s.`;
  }
  return "We're still waiting for your payment.";
}

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
  awaitingPayment: boolean;
  redirectInSeconds: number | null;
  error: string;
  onRefresh: () => void;
};

function PaymentStatusCard({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-1 items-center justify-center overflow-hidden px-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white text-center shadow-sm">
        <div className="px-6 py-8 sm:px-8">
          <div className="mx-auto mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-core-text text-white">
            {icon}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export function PyngCheckoutWaiting({
  checkoutUrl,
  failed,
  refreshing,
  awaitingPayment,
  redirectInSeconds,
  error,
  onRefresh,
}: PyngCheckoutWaitingProps) {
  const paymentCompleted = redirectInSeconds !== null;

  if (failed) {
    return (
      <PaymentStatusCard icon={<XMarkIcon className="h-5 w-5 stroke-[2.5]" aria-hidden />}>
        <h1 className="text-2xl font-bold tracking-tight text-core-text font-sans">This payment did not complete</h1>
        <p className="mt-4 text-sm font-light leading-relaxed text-gray-600 font-sans">
          The Pyng checkout expired or was declined. You can close this page.
        </p>
      </PaymentStatusCard>
    );
  }

  return (
    <PaymentStatusCard
      icon={
        paymentCompleted ? (
          <CheckIcon className="h-5 w-5 stroke-[2.5]" aria-hidden />
        ) : (
          <ArrowPathIcon className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} aria-hidden />
        )
      }
    >
      <h1 className="text-2xl font-bold tracking-tight text-core-text font-sans">
        {paymentCompleted ? "Payment completed" : "Payment in progress"}
      </h1>
      {paymentCompleted ? null : (
        <p className="mt-4 text-sm font-light leading-relaxed text-gray-600 font-sans">
          Pyng checkout will open in a new tab. Please keep this one open.
        </p>
      )}
      {checkoutUrl && !paymentCompleted ? (
        <p className="mt-3 text-sm font-light leading-relaxed text-gray-600 font-sans">
          If it does not open,{" "}
          <a
            href={checkoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-core-text underline underline-offset-4"
          >
            click here
          </a>
          .
        </p>
      ) : null}
      <div className="my-6 border-t border-gray-200" />
      {paymentCompleted ? (
        <p className="text-sm font-medium text-core-text font-sans" aria-live="polite">
          {pyngRefreshFeedback("succeeded", redirectInSeconds)}
        </p>
      ) : (
        <>
          <p className="text-sm font-light leading-relaxed text-gray-600 font-sans">
            When you&apos;ve finished paying, click Refresh to check.
          </p>
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-foreground bg-foreground px-4 py-3 text-sm font-semibold text-background font-sans transition-colors hover:bg-background hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden />
            {refreshing ? "Checking…" : "Refresh"}
          </button>
          {awaitingPayment || error ? (
            <p
              className={`mt-4 rounded-xl bg-surface px-4 py-3 text-sm font-sans ${error ? "text-red-600" : "text-foreground-muted"}`}
              aria-live="polite"
            >
              {error || pyngRefreshFeedback("pending", 0)}
            </p>
          ) : null}
        </>
      )}
    </PaymentStatusCard>
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
  const [awaitingPayment, setAwaitingPayment] = useState(false);
  const [redirectIn, setRedirectIn] = useState<number | null>(null);
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
          setAwaitingPayment(false);
          setError("");
          setRedirectIn(PYNG_SUCCESS_REDIRECT_SECONDS);
          return;
        }
        if (outcome === "failed") {
          stopped.current = true;
          setFailed(true);
          return;
        }
        setAwaitingPayment(true);
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

  useEffect(() => {
    if (redirectIn === null) {
      return;
    }
    const timeout = setTimeout(() => {
      if (redirectIn <= 1) {
        void onSucceededRef.current();
        return;
      }
      setRedirectIn(redirectIn - 1);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [redirectIn]);

  return (
    <FulfilmentEntityPage
      onPrev={onPrev}
      showPrevButton={!isFirstEntity}
      showNextButton={false}
      fulfilmentSessionInfo={fulfilmentSessionInfo}
      fulfilmentSessionId={fulfilmentSessionId}
      fitScreen
    >
      <PyngCheckoutWaiting
        checkoutUrl={checkoutUrl}
        failed={failed}
        refreshing={refreshing}
        awaitingPayment={awaitingPayment}
        redirectInSeconds={redirectIn}
        error={error}
        onRefresh={() => {
          void pollRef.current();
        }}
      />
    </FulfilmentEntityPage>
  );
}
