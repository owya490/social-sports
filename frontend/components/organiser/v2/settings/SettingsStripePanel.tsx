"use client";

import { getStripeStandardAccountLink } from "@/services/src/stripe/stripeService";
import { getRefreshAccountLinkUrl } from "@/services/src/stripe/stripeUtils";
import { getUrlWithCurrentHostname } from "@/services/src/urlUtils";
import StripeLogo from "@/public/images/stripe-logo.svg";
import { ArrowTopRightOnSquareIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Skeleton from "react-loading-skeleton";
import { SportshubStripeIntegrationIcon } from "./SportshubStripeIntegrationIcon";

type SettingsStripePanelProps = {
  stripeId: string;
  stripeLoading: boolean;
  userId: string;
  userLoading: boolean;
  onConnecting: (loading: boolean) => void;
};

export function SettingsStripePanel({
  stripeId,
  stripeLoading,
  userId,
  userLoading,
  onConnecting,
}: SettingsStripePanelProps) {
  const connected = Boolean(stripeId) && !stripeLoading;
  const needsSetup = !stripeLoading && !stripeId;

  return (
    <section aria-label="Stripe payments" className="rounded-xl border border-border bg-background overflow-hidden">
      <div className="px-4 sm:px-5 py-4 border-b border-border flex items-center justify-between gap-3">
        <div className="min-w-0 flex items-center gap-3">
          <SportshubStripeIntegrationIcon />
          <Image src={StripeLogo} alt="Stripe" className="h-8 w-auto sm:h-10" />
          {connected ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground font-sans">
              <CheckCircleIcon className="h-4 w-4" aria-hidden />
              Connected
            </span>
          ) : null}
        </div>
        {connected ? (
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

      <div className="p-4 sm:p-5 space-y-4">
        {stripeLoading ? (
          <div className="space-y-2">
            <Skeleton height={14} width={120} />
            <Skeleton height={44} className="!rounded-lg" />
          </div>
        ) : connected ? (
          <div>
            <p className="text-xs font-medium text-foreground-muted font-sans">Stripe account ID</p>
            <p className="mt-2 rounded-lg border border-border bg-surface px-3 py-2.5 font-mono text-sm text-foreground break-all">
              {stripeId}
            </p>
            <p className="mt-2 text-xs text-foreground-muted font-sans">
              This is your Stripe Connect identifier for receiving event payments.
            </p>
          </div>
        ) : needsSetup ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-foreground font-sans">Connect Stripe to get paid</p>
              <p className="mt-1 text-xs text-foreground-muted font-sans">
                Accept ticket payments securely through Stripe Connect. Setup usually takes a few minutes.
              </p>
            </div>
            <button
              type="button"
              disabled={userLoading || !userId}
              onClick={async () => {
                if (userLoading || !userId) return;
                onConnecting(true);
                window.scrollTo(0, 0);
                try {
                  const link = await getStripeStandardAccountLink(
                    userId,
                    getUrlWithCurrentHostname("/organiser/v2/dashboard"),
                    getRefreshAccountLinkUrl(),
                  );
                  window.location.href = link;
                } catch {
                  onConnecting(false);
                }
              }}
              className="inline-flex w-full sm:w-auto items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-contrast font-sans hover:brightness-95 transition-[filter] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60 disabled:pointer-events-none"
            >
              Connect Stripe
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
