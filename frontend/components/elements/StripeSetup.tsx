import { getStripeStandardAccountLink } from "@/services/src/stripe/stripeService";
import { getRefreshAccountLinkUrl } from "@/services/src/stripe/stripeUtils";
import { getUrlWithCurrentHostname } from "@/services/src/urlUtils";
import { BoltIcon, CreditCardIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction } from "react";
import { HighlightButton } from "./HighlightButton";

export default function StripeSetup(props: {
  userId: string;
  setLoading: Dispatch<SetStateAction<boolean>>;
  userLoading: boolean;
}) {
  const router = useRouter();
  const { userLoading } = props;

  return (
    <div className="bg-organiser-light-gray p-6 sm:p-8 rounded-2xl">
      <h2 className="font-bold text-2xl sm:text-3xl mb-3">Connect Your Stripe Account</h2>
      <p className="text-gray-700 mb-6">
        Start accepting payments for your events with secure, reliable payment processing through Stripe.
      </p>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="flex items-start gap-3">
          <CreditCardIcon className="w-6 h-6 text-highlight-yellow shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-sm">Accept Payments</h3>
            <p className="text-xs text-gray-600">Take bookings with instant payment processing</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <ShieldCheckIcon className="w-6 h-6 text-highlight-yellow shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-sm">Secure & Trusted</h3>
            <p className="text-xs text-gray-600">Bank-level security for all transactions</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <BoltIcon className="w-6 h-6 text-highlight-yellow shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-sm">Quick Setup</h3>
            <p className="text-xs text-gray-600">Get started in just a few minutes</p>
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
            getUrlWithCurrentHostname("/organiser/dashboard"),
            getRefreshAccountLinkUrl()
          );
          router.push(link);
        }}
      >
        {userLoading ? <div>Loading...</div> : "Connect Stripe Account"}
      </HighlightButton>
    </div>
  );
}
