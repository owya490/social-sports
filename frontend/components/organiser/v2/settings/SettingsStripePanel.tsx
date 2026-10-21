"use client";

import { useUser } from "@/components/utility/UserContext";
import { useStripeSetupLink } from "@/components/utility/useStripeSetupLink";
import { isStripeAccountActive } from "@/services/src/stripe/stripeUtils";
import StripeLogo from "@/public/images/stripe-logo.svg";
import { ArrowPathIcon, ArrowTopRightOnSquareIcon, CheckCircleIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Skeleton from "react-loading-skeleton";
import { SportshubStripeIntegrationIcon } from "./SportshubStripeIntegrationIcon";

type SettingsStripePanelProps = {
  stripeId: string;
  stripeLoading: boolean;
  stripeError: boolean;
  onRetryStripeStatus: () => void;
  userId: string;
  userLoading: boolean;
};

const setupReturnPath = "/organiser/v2/dashboard";
const resyncReturnPath = "/organiser/v2/settings";

export function SettingsStripePanel({
  stripeId,
  stripeLoading,
  stripeError,
  onRetryStripeStatus,
  userId,
  userLoading,
}: SettingsStripePanelProps) {
  const { user, auth } = useUser();
  const authUserId = auth.currentUser?.uid;
  const paymentsActive = isStripeAccountActive(user.stripeAccountActive);
  const statusKnown = !stripeLoading && !stripeError;
  const hasStripeAccount = Boolean(stripeId) && statusKnown;
  const needsSetup = statusKnown && (!hasStripeAccount || !paymentsActive);
  const fullyConnected = hasStripeAccount && paymentsActive;
  const accountAvailable = !userLoading && Boolean(userId) && user.userId === userId && authUserId === userId;
  const { canOpen, openingDestination: opening, failed, openStripe, retry } = useStripeSetupLink({
    userId,
    eligible: !userLoading && statusKnown,
  });

  return (
    <section aria-label="Stripe payments" className="rounded-xl border border-border bg-background overflow-hidden">
      <div className="px-4 sm:px-5 py-4 border-b border-border flex items-center justify-between gap-3">
        <div className="min-w-0 flex items-center gap-3">
          <SportshubStripeIntegrationIcon />
          <Image src={StripeLogo} alt="Stripe" className="h-8 w-auto sm:h-10" />
          {fullyConnected ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground font-sans">
              <CheckCircleIcon className="h-4 w-4" aria-hidden />
              Connected
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasStripeAccount ? (
            <button
              type="button"
              disabled={opening !== null || !canOpen}
              onClick={() => {
                void openStripe(resyncReturnPath);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground-secondary hover:text-foreground hover:bg-surface font-sans transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60 disabled:pointer-events-none"
              aria-label="Resync Stripe account"
            >
              <ArrowPathIcon className={`h-4 w-4 ${opening === resyncReturnPath ? "animate-spin motion-reduce:animate-none" : ""}`} aria-hidden />
              <span className="hidden sm:inline">Resync</span>
            </button>
          ) : null}
          {hasStripeAccount ? (
            <a
              href="https://dashboard.stripe.com/login"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground-secondary hover:text-foreground font-sans transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              <span className="hidden sm:inline">Open dashboard</span>
              <ArrowTopRightOnSquareIcon className="h-4 w-4" aria-hidden />
            </a>
          ) : null}
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {stripeLoading ? (
          <div className="space-y-2">
            <Skeleton height={14} width={120} />
            <Skeleton height={44} className="!rounded-lg" />
          </div>
        ) : stripeError ? (
          <div role="alert" className="space-y-2 font-sans">
            <p className="text-sm font-semibold text-foreground">Status unavailable</p>
            <p className="text-xs text-foreground-muted">
              We couldn&apos;t check your Stripe account. Retry loading before connecting or resyncing.
            </p>
            <button
              type="button"
              onClick={onRetryStripeStatus}
              disabled={!accountAvailable}
              className="text-sm font-semibold text-foreground underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60"
            >
              Retry loading Stripe status
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {hasStripeAccount ? (
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-medium text-foreground-muted font-sans">Stripe account ID</p>
                  {paymentsActive ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold text-foreground font-sans">
                      <CheckCircleIcon className="h-3.5 w-3.5" aria-hidden />
                      Payouts active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold text-foreground-secondary font-sans">
                      <ExclamationCircleIcon className="h-3.5 w-3.5" aria-hidden />
                      Payouts inactive
                    </span>
                  )}
                </div>
                <p className="mt-2 rounded-lg border border-border bg-surface px-3 py-2.5 font-mono text-sm text-foreground break-all">
                  {stripeId}
                </p>
                <p className="mt-2 text-xs text-foreground-muted font-sans">
                  This is your Stripe Connect identifier for receiving event payments.
                  {!paymentsActive ? " If Stripe shows your account as ready, use Resync to update payout status." : null}
                </p>
              </div>
            ) : null}
            {needsSetup ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-foreground font-sans">
                    {hasStripeAccount ? "Complete your Stripe setup" : "Connect Stripe to get paid"}
                  </p>
                  <p className="mt-1 text-xs text-foreground-muted font-sans">
                    {hasStripeAccount
                      ? "Finish connecting your Stripe account to start receiving payouts."
                      : "Accept ticket payments securely through Stripe Connect. Setup usually takes a few minutes."}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={opening !== null || !canOpen}
                  onClick={() => {
                    void openStripe(setupReturnPath);
                  }}
                  className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-contrast font-sans hover:brightness-95 transition-[filter] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60 disabled:pointer-events-none"
                >
                  {opening === setupReturnPath ? "Opening Stripe..." : hasStripeAccount ? "Continue Stripe setup" : "Connect Stripe"}
                </button>
              </div>
            ) : null}
          </div>
        )}
        {opening !== null ? (
          <p role="status" className="text-sm text-foreground-muted font-sans">Opening Stripe...</p>
        ) : null}
        {failed ? (
          <div role="alert" className="space-y-2 text-sm font-sans">
            <p className="text-danger">
              We couldn&apos;t open Stripe. Setup may have started. Try opening Stripe again, or check your Stripe dashboard before continuing.
            </p>
            <button
              type="button"
              disabled={!canOpen}
              onClick={() => void retry()}
              className="font-semibold text-foreground underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60"
            >
              Try opening Stripe again
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
