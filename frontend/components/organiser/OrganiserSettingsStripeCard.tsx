import React from "react";
import StripeLogo from "../../public/images/stripe-logo.svg";
import Image from "next/image";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";

const OrganiserSettingsStripeCard = () => {
  return (
    <div>
      <div>
        <div className="border-organiser-darker-light-gray border-solid border-2 rounded-3xl px-4 pt-2 relative">
          <Image src={StripeLogo} alt="..." className="w-28" />
          <div className="p-4">
            <span>
              <div className="text-organiser-title-gray-text font-bold text-lg underline">Your Stripe Account</div>
              <ArrowTopRightOnSquareIcon className="w-6" />
            </span>
            <div className="font-bold text-2xl">Volleyball World Cup</div>
          </div>
        </div>
        <div></div>
      </div>
    </div>
  );
};

export default OrganiserSettingsStripeCard;
