"use client";

import { useStripeSetupLink } from "@/components/utility/useStripeSetupLink";
import { BoltIcon, CreditCardIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { HighlightButton } from "../elements/HighlightButton";

export default function OnboardingStripeSetup(props: {
  userId: string;
  userLoading: boolean;
}) {
  const { userId, userLoading } = props;
  const { canOpen, openingDestination, failed, openStripe, retry } = useStripeSetupLink({
    userId,
    eligible: !userLoading,
  });
  const opening = openingDestination !== null;

  return (
    <div className="bg-organiser-light-gray p-6 sm:p-8 rounded-2xl">
      <h2 className="font-bold text-2xl sm:text-3xl mb-3">Connect payouts for paid tickets</h2>
      <p className="text-gray-700 mb-6">
        One-time setup with our payments partner: link where ticket payouts go so you can publish paid events.{" "}
        <span className="font-medium text-core-text">Free sessions don&apos;t need this.</span>
      </p>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="flex items-start gap-3">
          <CreditCardIcon aria-hidden="true" className="w-6 h-6 text-highlight-yellow shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-sm">Sell tickets later</h3>
            <p className="text-xs text-gray-600">Turn on paid pricing only when you choose — not required for free RSVP</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <ShieldCheckIcon aria-hidden="true" className="w-6 h-6 text-highlight-yellow shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-sm">Handled securely</h3>
            <p className="text-xs text-gray-600">Card payments go through Stripe — standard for online ticket sales</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <BoltIcon aria-hidden="true" className="w-6 h-6 text-highlight-yellow shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-sm">Usually quick</h3>
            <p className="text-xs text-gray-600">Most organisers finish in a few minutes</p>
          </div>
        </div>
      </div>

      <HighlightButton
        className="w-full sm:w-auto sm:ml-auto"
        disabled={opening || !canOpen}
        onClick={() => void openStripe("/onboarding/organiser")}
      >
        {opening ? "Opening Stripe..." : userLoading ? "Loading..." : "Connect payouts"}
      </HighlightButton>
      {opening ? <p role="status" className="mt-3 text-sm text-gray-700">Opening Stripe...</p> : null}
      {failed ? (
        <div role="alert" className="mt-4 space-y-2 text-sm">
          <p className="text-danger">
            We couldn&apos;t open Stripe. Setup may have started. Try opening Stripe again, or continue with free events and finish payouts later.
          </p>
          <button
            type="button"
            disabled={!canOpen}
            onClick={() => void retry()}
            className="font-semibold underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60"
          >
            Try opening Stripe again
          </button>
        </div>
      ) : null}
    </div>
  );
}
