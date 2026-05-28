import { getStripeStandardAccountLink } from "@/services/src/stripe/stripeService";
import { getRefreshAccountLinkUrl } from "@/services/src/stripe/stripeUtils";
import { getUrlWithCurrentHostname } from "@/services/src/urlUtils";
import { BoltIcon, CreditCardIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { Dispatch, SetStateAction } from "react";
import { HighlightButton } from "./HighlightButton";

export default function StripeSetup(props: {
  userId: string;
  setLoading: Dispatch<SetStateAction<boolean>>;
  userLoading: boolean;
  /** Where Stripe sends the user after Connect (default: organiser dashboard). */
  stripeReturnPath?: string;
}) {
  const { userLoading, stripeReturnPath = "/organiser/dashboard" } = props;

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
        disabled={userLoading || !props.userId}
        onClick={async () => {
          if (userLoading || !props.userId) return;

          props.setLoading(true);
          window.scrollTo(0, 0);
          const link = await getStripeStandardAccountLink(
            props.userId,
            getUrlWithCurrentHostname(stripeReturnPath),
            getRefreshAccountLinkUrl()
          );
          // Full-page navigation preserves normal browser history for Stripe-hosted flows (App Router push can behave oddly cross-origin).
          window.location.assign(link);
        }}
      >
        {userLoading ? "Loading..." : "Connect payouts"}
      </HighlightButton>
    </div>
  );
}
