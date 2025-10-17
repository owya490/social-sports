import StripeLogo from "@/public/images/stripe-logo.svg";
import { ArrowTopRightOnSquareIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Skeleton from "react-loading-skeleton";

const OrganiserSettingsStripeCard = (props: { stripeId: string; stripeLoading: boolean }) => {
  if (!props.stripeId && !props.stripeLoading) {
    return null;
  }

  return (
    <div className="bg-organiser-light-gray p-6 sm:p-8 rounded-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Image src={StripeLogo} alt="Stripe Logo" className="w-20 sm:w-28" />
          {props.stripeId && !props.stripeLoading && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircleIcon className="w-5 h-5" />
              <span className="text-sm font-semibold">Connected</span>
            </div>
          )}
        </div>
        {props.stripeId && !props.stripeLoading && (
          <a
            href="https://dashboard.stripe.com/login"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-semibold text-highlight-yellow hover:underline transition-all"
          >
            <span className="hidden sm:inline">Open Dashboard</span>
            <ArrowTopRightOnSquareIcon className="w-5 h-5" />
          </a>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-lg">Stripe Account ID</h3>
        {props.stripeLoading ? (
          <Skeleton height={48} className="rounded-xl" />
        ) : (
          <div className="bg-white border-2 border-organiser-darker-light-gray rounded-xl px-4 py-3">
            <p className="font-mono text-sm break-all text-gray-700">{props.stripeId}</p>
          </div>
        )}
        <p className="text-sm text-gray-600 mt-2">
          This is your unique Stripe account identifier. Use this to receive payments for your events.
        </p>
      </div>
    </div>
  );
};

export default OrganiserSettingsStripeCard;
