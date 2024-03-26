import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import React from "react";

const OrganiserSettingsAboutCard = () => {
  return (
    <div>
      <div>
        <div className="">
          {/* <Image src={StripeLogo} alt="..." className="w-28" /> */}
          <div className="text-3xl font-bold">About the Organiser</div>
          <div className="p-4 space-y-4">
            <div>
              <div className="font-bold text-xl text-organiser-title-gray-text">Organiser Page URL</div>
              <div className="flex space-x-2">
                <div className="text-organiser-title-gray-text font-bold text-lg underline">Your Stripe Account</div>
                <ArrowTopRightOnSquareIcon className="w-4" />
              </div>
            </div>

            <div>
              <div className="font-bold text-xl text-organiser-title-gray-text">Stripe Account ID</div>
              <div className="border-organiser-darker-light-gray border-solid border-2 rounded-3xl pl-4 p-2 relative w-3/4">
                12365237512375
              </div>
            </div>
            <div>
              <div className="font-bold text-xl text-organiser-title-gray-text">Stripe Payment Method</div>
              <div className="border-organiser-darker-light-gray border-solid border-2 rounded-3xl pl-4 p-2 relative w-3/4">
                PayPal
              </div>
            </div>
          </div>
        </div>
        <div></div>
      </div>
    </div>
  );
};

export default OrganiserSettingsAboutCard;
