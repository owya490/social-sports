import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import React from "react";

const OrganiserSettingsAboutCard = () => {
  return (
    <div>
      <div>
        <div className="p-4">
          <div className="text-3xl font-bold mb-2">About the Organiser</div>
          <div className="space-y-4">
            <div>
              <div className="font-bold text-xl text-organiser-title-gray-text mb-2">Organiser Page URL</div>
              <div className="flex space-x-2">
                <div className="text-organiser-title-gray-text text-lg underline">
                  https://www.sportshub.net.au/organiser/108973271
                </div>
                <ArrowTopRightOnSquareIcon className="w-4" />
              </div>
            </div>

            <div>
              <div className="font-bold text-xl text-organiser-title-gray-text mb-2">Organisation Bio</div>
              <div className="border-organiser-darker-light-gray border-solid border-2 rounded-3xl pl-4 p-2 relative w-3/4">
                This is a bio about this organisation
              </div>
            </div>
            <div>
              <div className="font-bold text-xl text-organiser-title-gray-text mb-2">Organisation Social Media</div>
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
