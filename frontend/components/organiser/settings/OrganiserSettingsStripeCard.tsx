import StripeLogo from "@/public/images/stripe-logo.svg";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

const OrganiserSettingsStripeCard = (props: { stripeId: string }) => {
  return (
    <div>
      <div>
        <div className="border-organiser-darker-light-gray border-solid border-2 rounded-3xl px-4 pt-2 relative">
          <Image src={StripeLogo} alt="Stripe Logo" className="w-28" />
          <div className="p-4 space-y-4">
            <a href="https://dashboard.stripe.com/login" target="_blank" className="flex space-x-2">
              <h2 className=" font-bold text-xl underline">Your Stripe Account</h2>
              <ArrowTopRightOnSquareIcon className="w-4" />
            </a>
            <div>
              <h2 className="font-bold text-xl">Stripe Account ID</h2>
              <div>
                {"->"} {props.stripeId}
              </div>
            </div>
          </div>
        </div>
        <div></div>
      </div>
    </div>
  );
};

export default OrganiserSettingsStripeCard;
